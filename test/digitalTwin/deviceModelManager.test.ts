// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as path from "path";
import { ColorizedChannel } from "../../src/DigitalTwin/pnp/src/common/colorizedChannel";
import { Constants } from "../../src/DigitalTwin/pnp/src/common/constants";
import { ProcessError } from "../../src/DigitalTwin/pnp/src/common/processError";
import { Utility } from "../../src/DigitalTwin/pnp/src/common/utility";
import { DeviceModelManager, ModelType } from "../../src/DigitalTwin/pnp/src/deviceModel/deviceModelManager";
import { UI } from "../../src/DigitalTwin/pnp/src/view/ui";

const vscode = require("../../__mocks__/vscode");

jest.mock("../../src/DigitalTwin/pnp/src/view/ui");

describe("Device model manager", () => {
  const context = vscode.ExtensionContext;
  const channel = new ColorizedChannel(Constants.CHANNEL_NAME);
  const manager = new DeviceModelManager(context, channel);

  UI.selectRootFolder = jest.fn().mockResolvedValue("root");
  UI.inputModelName = jest.fn().mockResolvedValue("test");
  Utility.createFileFromTemplate = jest.fn();

  test("create interface successfully", async () => {
    await manager.createModel(ModelType.Interface);
    expect(UI.openAndShowTextDocument).toBeCalledWith(path.join("root", "test.interface.json"));
  });

  test("create interface with error", async () => {
    Utility.createFileFromTemplate = jest.fn().mockImplementationOnce(() => {
      throw new Error();
    });
    await expect(manager.createModel(ModelType.Interface)).rejects.toThrow(ProcessError);
  });

  test("create capability model successfully", async () => {
    await manager.createModel(ModelType.CapabilityModel);
    expect(UI.openAndShowTextDocument).toBeCalledWith(path.join("root", "test.capabilitymodel.json"));
  });

  test("create capability model with error", async () => {
    Utility.createFileFromTemplate = jest.fn().mockImplementationOnce(() => {
      throw new Error();
    });
    await expect(manager.createModel(ModelType.CapabilityModel)).rejects.toThrow(ProcessError);
  });
});
