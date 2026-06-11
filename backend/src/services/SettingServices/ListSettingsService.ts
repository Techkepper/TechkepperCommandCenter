import Setting from "../../models/Setting";

const ListSettingsService = async (): Promise<Setting[]> => {
  const settings = await Setting.findAll();

  return settings;
};

export default ListSettingsService;
