import faker from "faker";
import AppError from "../../../errors/AppError";
import CreateUserService from "../../../services/UserServices/CreateUserService";
import DeleteUserService from "../../../services/UserServices/DeleteUserService";
import { disconnect, truncate } from "../../utils/database";

const testPassword = () => faker.internet.password(12);

describe("User", () => {
  beforeEach(async () => {
    await truncate();
  });

  afterEach(async () => {
    await truncate();
  });

  afterAll(async () => {
    await disconnect();
  });

  it("should be delete a existing user", async () => {
    const { id } = await CreateUserService({
      name: faker.name.findName(),
      email: faker.internet.email(),
      password: testPassword()
    });

    await expect(DeleteUserService(id)).resolves.toBeUndefined();
  });

  it("to throw an error if tries to delete a non existing user", async () => {
    await expect(DeleteUserService(faker.random.number())).rejects.toBeInstanceOf(
      AppError
    );
  });
});
