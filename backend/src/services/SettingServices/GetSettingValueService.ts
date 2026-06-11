import Setting from "../../models/Setting";

const GetSettingValueService = async (
  key: string,
  fallback = ""
): Promise<string> => {
  const setting = await Setting.findByPk(key);
  return setting?.value ?? fallback;
};

export default GetSettingValueService;
