import { Op } from "sequelize";
import Contact from "../../models/Contact";
import Ticket from "../../models/Ticket";
import { logger } from "../../utils/logger";
import { EmitContactEvent } from "../../helpers/EmitContactEvent";
import {
  getContactNumberVariants,
  isGenericContactName,
  normalizeContactNumber
} from "../../helpers/NormalizeContactNumber";

interface ExtraInfo {
  name: string;
  value: string;
}

interface Request {
  name: string;
  number: string;
  lid?: string;
  isGroup: boolean;
  email?: string;
  profilePicUrl?: string;
  extraInfo?: ExtraInfo[];
}

const emitContact = (
  action: "update" | "create",
  contact: Contact
): Promise<void> => EmitContactEvent(action, contact);

const getPreferredName = (name: string, fallback: string): string => {
  const trimmedName = name?.trim();
  return trimmedName || fallback;
};

const CreateOrUpdateContactService = async ({
  name,
  number: rawNumber,
  lid,
  profilePicUrl,
  isGroup,
  email = "",
  extraInfo = []
}: Request): Promise<Contact> => {
  const number = isGroup ? rawNumber : normalizeContactNumber(rawNumber);
  const numberVariants = isGroup ? [number] : getContactNumberVariants(number);
  const contactName = getPreferredName(name, number || lid || "");
  if (!number && !lid) throw new Error("Either number or lid must be provided");

  const [contactsByNumber, contactByLid] = await Promise.all([
    numberVariants.length
      ? Contact.findAll({ where: { number: { [Op.in]: numberVariants } } })
      : [],
    lid ? Contact.findOne({ where: { lid } }) : null
  ]);
  const contactByNumber =
    contactsByNumber.find(contact => contact.number === number) ||
    contactsByNumber[0] ||
    null;
  const duplicateNumberContacts = contactsByNumber.filter(
    contact => contactByNumber && contact.id !== contactByNumber.id
  );

  const shouldMerge =
    contactByNumber && contactByLid && contactByNumber.id !== contactByLid.id;

  if (shouldMerge) {
    await Ticket.update(
      { contactId: contactByNumber.id },
      { where: { contactId: contactByLid.id } }
    );

    await contactByLid.destroy();

    await contactByNumber.update({
      name: isGenericContactName(contactByNumber.name, numberVariants)
        ? contactName
        : contactByNumber.name,
      number,
      lid: contactByLid.lid,
      profilePicUrl
    });

    logger.info({
      info: "Merged contacts by number and lid",
      primaryContactId: contactByNumber.id,
      mergedContactId: contactByLid.id
    });

    await emitContact("update", contactByNumber);

    return contactByNumber;
  }

  if (contactByNumber) {
    await Promise.all(
      duplicateNumberContacts.map(async duplicateContact => {
        await Ticket.update(
          { contactId: contactByNumber.id },
          { where: { contactId: duplicateContact.id } }
        );
        await duplicateContact.destroy();
      })
    );

    await contactByNumber.update({
      name: isGenericContactName(contactByNumber.name, numberVariants)
        ? contactName
        : contactByNumber.name,
      number,
      lid: lid || contactByNumber.lid,
      profilePicUrl
    });

    await emitContact("update", contactByNumber);

    return contactByNumber;
  }

  if (contactByLid) {
    await contactByLid.update({
      name: isGenericContactName(contactByLid.name, numberVariants)
        ? contactName
        : contactByLid.name,
      number: number || contactByLid.number,
      profilePicUrl
    });

    await emitContact("update", contactByLid);
    return contactByLid;
  }

  const created = await Contact.create({
    name: contactName,
    number,
    lid,
    profilePicUrl,
    email,
    isGroup,
    extraInfo
  } as any);

  await emitContact("create", created);
  return created;
};

export default CreateOrUpdateContactService;
