import { Sequelize } from "sequelize-typescript";
import User from "../models/User";
import Setting from "../models/Setting";
import Contact from "../models/Contact";
import Ticket from "../models/Ticket";
import Whatsapp from "../models/Whatsapp";
import ContactCustomField from "../models/ContactCustomField";
import Message from "../models/Message";
import Queue from "../models/Queue";
import WhatsappQueue from "../models/WhatsappQueue";
import UserQueue from "../models/UserQueue";
import QuickAnswer from "../models/QuickAnswer";
import Ecosystem from "../models/Ecosystem";
import TicketAssignmentEvent from "../models/TicketAssignmentEvent";
import SmartDocument from "../models/SmartDocument";
import SmartDocumentTemplate from "../models/SmartDocumentTemplate";
import SmartDocumentTemplateVersion from "../models/SmartDocumentTemplateVersion";
import BusinessClient from "../models/BusinessClient";
import BusinessClientDocument from "../models/BusinessClientDocument";
import Collaborator from "../models/Collaborator";
import CollaboratorDocument from "../models/CollaboratorDocument";
import SmartDocumentEvent from "../models/SmartDocumentEvent";
import InternalNotification from "../models/InternalNotification";
import CommercialProposal from "../models/CommercialProposal";
import CommercialProposalItem from "../models/CommercialProposalItem";
import CommercialProposalPaymentMilestone from "../models/CommercialProposalPaymentMilestone";
import CommercialProposalEvent from "../models/CommercialProposalEvent";
import ExternalStorageConnection from "../models/ExternalStorageConnection";

// eslint-disable-next-line
const dbConfig = require("../config/database");
// import dbConfig from "../config/database";

const sequelize = new Sequelize(dbConfig);

const models = [
  User,
  Contact,
  Ticket,
  Message,
  Whatsapp,
  ContactCustomField,
  Setting,
  Queue,
  WhatsappQueue,
  UserQueue,
  QuickAnswer,
  Ecosystem,
  TicketAssignmentEvent,
  SmartDocument,
  SmartDocumentTemplate,
  SmartDocumentTemplateVersion,
  BusinessClient,
  BusinessClientDocument,
  Collaborator,
  CollaboratorDocument,
  SmartDocumentEvent,
  InternalNotification,
  CommercialProposal,
  CommercialProposalItem,
  CommercialProposalPaymentMilestone,
  CommercialProposalEvent,
  ExternalStorageConnection
];

sequelize.addModels(models);

export default sequelize;
