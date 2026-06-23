import Whatsapp from "../../models/Whatsapp";
import AppError from "../../errors/AppError";
import Ticket from "../../models/Ticket";
import User from "../../models/User";
import WhatsappQueue from "../../models/WhatsappQueue";
import sequelize from "../../database";

const DeleteWhatsAppService = async (
  id: string
): Promise<Whatsapp | null> => {
  const replacementDefaultWhatsapp = await sequelize.transaction(
    async transaction => {
      const whatsapp = await Whatsapp.findOne({
        where: { id },
        transaction
      });

      if (!whatsapp) {
        throw new AppError("ERR_NO_WAPP_FOUND", 404);
      }

      await Promise.all([
        User.update(
          { whatsappId: null },
          { where: { whatsappId: whatsapp.id }, transaction }
        ),
        Ticket.update(
          { whatsappId: null } as any,
          { where: { whatsappId: whatsapp.id }, transaction }
        ),
        WhatsappQueue.destroy({
          where: { whatsappId: whatsapp.id },
          transaction
        })
      ]);

      const shouldChooseNewDefault = whatsapp.isDefault;

      await whatsapp.destroy({ transaction });

      if (!shouldChooseNewDefault) return null;

      const nextDefaultWhatsapp = await Whatsapp.findOne({
        order: [["id", "ASC"]],
        transaction
      });

      if (!nextDefaultWhatsapp) return null;

      await nextDefaultWhatsapp.update({ isDefault: true }, { transaction });
      return nextDefaultWhatsapp;
    }
  );

  return replacementDefaultWhatsapp;
};

export default DeleteWhatsAppService;
