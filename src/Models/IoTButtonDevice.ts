// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import * as fs from 'fs-plus';
import * as os from 'os';
import * as path from 'path';
import * as request from 'request-promise';
import {error} from 'util';
import * as vscode from 'vscode';

import {ConfigHandler} from '../configHandler';
import {ConfigKey, FileNames} from '../constants';
import {ProjectTemplate, ProjectTemplateType} from '../Models/Interfaces/ProjectTemplate';
import {IoTProject} from '../Models/IoTProject';

import {Component, ComponentType} from './Interfaces/Component';
import {Device, DeviceType} from './Interfaces/Device';

const constants = {
  timeout: 10000,
  accessEndpoint: 'http://192.168.4.1',
  userjsonFilename: 'userdata.json'
};


export class IoTButtonDevice implements Device {
  private deviceType: DeviceType;
  private componentType: ComponentType;
  private deviceFolder: string;
  private extensionContext: vscode.ExtensionContext;
  private inputFileName = '';

  private static _boardId = 'iotbutton';

  static get boardId() {
    return IoTButtonDevice._boardId;
  }

  constructor(
      context: vscode.ExtensionContext, devicePath: string,
      inputFileName?: string) {
    this.deviceType = DeviceType.IoT_Button;
    this.componentType = ComponentType.Device;
    this.deviceFolder = devicePath;
    this.extensionContext = context;
    if (inputFileName) {
      this.inputFileName = inputFileName;
    }
  }

  name = 'IoTButton';

  getDeviceType(): DeviceType {
    return this.deviceType;
  }

  getComponentType(): ComponentType {
    return this.componentType;
  }

  async load(): Promise<boolean> {
    const deviceFolderPath = this.deviceFolder;

    if (!fs.existsSync(deviceFolderPath)) {
      throw new Error(`Device folder doesn't exist: ${deviceFolderPath}`);
    }
    return true;
  }

  async create(): Promise<boolean> {
    if (!this.inputFileName) {
      throw new Error('No user data file found.');
    }
    const deviceFolderPath = this.deviceFolder;

    if (!fs.existsSync(deviceFolderPath)) {
      throw new Error(`Device folder doesn't exist: ${deviceFolderPath}`);
    }

    try {
      const iotworkbenchprojectFilePath =
          path.join(deviceFolderPath, FileNames.iotworkbenchprojectFileName);
      fs.writeFileSync(iotworkbenchprojectFilePath, ' ');
    } catch (error) {
      throw new Error(
          `Device: create iotworkbenchproject file failed: ${error.message}`);
    }

    // Create an empty userdata.json
    const userdataJsonFilePath = this.extensionContext.asAbsolutePath(path.join(
        FileNames.resourcesFolderName, IoTButtonDevice._boardId,
        this.inputFileName));
    const newUserdataPath = path.join(deviceFolderPath, this.inputFileName);

    try {
      const content = fs.readFileSync(userdataJsonFilePath).toString();
      fs.writeFileSync(newUserdataPath, content);
    } catch (error) {
      throw new Error(`Create userdata json file failed: ${error.message}`);
    }

    const vscodeFolderPath =
        path.join(deviceFolderPath, FileNames.vscodeSettingsFolderName);
    if (!fs.existsSync(vscodeFolderPath)) {
      fs.mkdirSync(vscodeFolderPath);
    }

    // Create settings.json config file
    const settingsJSONFilePath =
        path.join(vscodeFolderPath, FileNames.settingsJsonFileName);
    const settingsJSONObj = {
      'files.exclude': {'.build': true, '.iotworkbenchproject': true}
    };

    try {
      fs.writeFileSync(
          settingsJSONFilePath, JSON.stringify(settingsJSONObj, null, 4));
    } catch (error) {
      throw new Error(`Device: create config file failed: ${error.message}`);
    }

    return true;
  }

  async compile(): Promise<boolean> {
    throw new Error(
        'Compiling device code for Azure IoT Button is not supported');
  }

  async upload(): Promise<boolean> {
    throw new Error(
        'Uploading device code for Azure IoT Button is not supported');
  }

  async configDeviceSettings(): Promise<boolean> {
    // TODO: try to connect to access point host of IoT button to detect the
    // connection.
    const configSelectionItems: vscode.QuickPickItem[] = [
      {
        label: 'Config WiFi of Azure IoT Button',
        description: 'Config WiFi of Azure IoT Button',
        detail: 'Config WiFi'
      },
      {
        label: 'Config connection of IoT Hub Device',
        description: 'Config connection of IoT Hub Device',
        detail: 'Config IoT Hub Device'
      },
      {
        label: 'Config time server of Azure IoT Button',
        description: 'Config time server of Azure IoT Button',
        detail: 'Config Time Server'
      },
      {
        label: 'Config JSON data to append to message',
        description: 'Config JSON data to append to message',
        detail: 'Config User Json Data'
      },
      {
        label: 'Save all config and shutdown Azure IoT Button',
        description: 'Save all config and shutdown Azure IoT Button',
        detail: 'Save and Shutdown'
      }
    ];

    const configSelection =
        await vscode.window.showQuickPick(configSelectionItems, {
          ignoreFocusOut: true,
          matchOnDescription: true,
          matchOnDetail: true,
          placeHolder: 'Select an option',
        });

    if (!configSelection) {
      return false;
    }

    if (configSelection.detail === 'Config WiFi') {
      try {
        const res = await this.configWifi();
        if (res) {
          vscode.window.showInformationMessage('Config WiFi successfully.');
        }
      } catch (error) {
        vscode.window.showWarningMessage('Config WiFi failed.');
      }
    } else if (configSelection.detail === 'Config IoT Hub Device') {
      try {
        const res = await this.configHub();
        if (res) {
          vscode.window.showInformationMessage(
              'Config Azure IoT Hub successfully.');
        }
      } catch (error) {
        vscode.window.showWarningMessage('Config IoT Hub failed.');
      }
    } else if (configSelection.detail === 'Config Time Server') {
      try {
        const res = await this.configNtp();
        if (res) {
          vscode.window.showInformationMessage(
              'Config time server successfully.');
        }
      } catch (error) {
        vscode.window.showWarningMessage('Config IoT Hub failed.');
      }
    } else if (configSelection.detail === 'Config User Json Data') {
      try {
        const res = await this.configUserData();
        if (res) {
          vscode.window.showInformationMessage(
              'Config user data successfully.');
        }
      } catch (error) {
        vscode.window.showWarningMessage('Config user data failed.');
      }
    } else {
      try {
        const res = await this.configSaveAndShutdown();
      } catch (error) {
        // Ignore.
        // Because the button has been shutdown, we won't get any response for
        // the action
      }

      vscode.window.showInformationMessage('Config saved.');
      return true;
    }

    return await this.configDeviceSettings();
  }

  async setConfig(uri: string, data: {}) {
    const option =
        {uri, method: 'POST', timeout: constants.timeout, form: data};

    const res = await request(option);

    if (!res) {
      throw new Error('Empty response.');
    }

    return res;
  }

  async configWifi() {
    const ssid = await vscode.window.showInputBox({
      prompt: `WiFi SSID`,
      ignoreFocusOut: true,
      validateInput: (ssid: string) => {
        if (!ssid) {
          return 'WiFi SSID cannot be empty.';
        } else {
          return;
        }
      }
    });

    if (ssid === undefined) {
      return false;
    }

    const password = await vscode.window.showInputBox(
        {prompt: `WiFi Password`, password: true, ignoreFocusOut: true});

    if (password === undefined) {
      return false;
    }

    const data = {ssid, password};
    const uri = constants.accessEndpoint;

    const res = await this.setConfig(uri, data);

    return res;
  }

  async configHub() {
    let deviceConnectionString =
        ConfigHandler.get<string>(ConfigKey.iotHubDeviceConnectionString);

    let hostName = '';
    let deviceId = '';
    if (deviceConnectionString) {
      const hostnameMatches =
          deviceConnectionString.match(/HostName=(.*?)(;|$)/);
      if (hostnameMatches) {
        hostName = hostnameMatches[0];
      }

      const deviceIDMatches =
          deviceConnectionString.match(/DeviceId=(.*?)(;|$)/);
      if (deviceIDMatches) {
        deviceId = deviceIDMatches[0];
      }
    }

    let deviceConnectionStringSelection: vscode.QuickPickItem[] = [];
    if (deviceId && hostName) {
      deviceConnectionStringSelection = [
        {
          label: 'Select IoT Hub Device Connection String',
          description: '',
          detail: `Device Information: ${hostName} ${deviceId}`
        },
        {
          label: 'Input IoT Hub Device Connection String',
          description: '',
          detail: 'Input another...'
        }
      ];
    } else {
      deviceConnectionStringSelection = [{
        label: 'Input IoT Hub Device Connection String',
        description: '',
        detail: 'Input another...'
      }];
    }

    const selection =
        await vscode.window.showQuickPick(deviceConnectionStringSelection, {
          ignoreFocusOut: true,
          placeHolder: 'Choose IoT Hub Device Connection String'
        });

    if (!selection) {
      return false;
    }

    if (selection.detail === 'Input another...') {
      const option: vscode.InputBoxOptions = {
        value:
            'HostName=<Host Name>;DeviceId=<Device Name>;SharedAccessKey=<Device Key>',
        prompt: `Please input device connection string here.`,
        ignoreFocusOut: true,
        validateInput: (connectionString: string) => {
          if (!connectionString) {
            return 'Connection string cannot be empty.';
          } else {
            return;
          }
        }
      };

      deviceConnectionString = await vscode.window.showInputBox(option);
      if (deviceConnectionString === undefined) {
        return false;
      }

      if ((deviceConnectionString.indexOf('HostName') === -1) ||
          (deviceConnectionString.indexOf('DeviceId') === -1) ||
          (deviceConnectionString.indexOf('SharedAccessKey') === -1)) {
        throw new Error(
            'The format of the IoT Hub Device connection string is invalid. Please provide a valid Device connection string.');
      }
    }

    if (!deviceConnectionString) {
      return false;
    }

    console.log(deviceConnectionString);

    const iothubMatches = deviceConnectionString.match(/HostName=(.*?)(;|$)/);
    const iotdevicenameMatches =
        deviceConnectionString.match(/DeviceId=(.*?)(;|$)/);
    const iotdevicesecretMatches =
        deviceConnectionString.match(/SharedAccessKey=(.*?)(;|$)/);
    if (!iothubMatches || !iothubMatches[1] || !iotdevicenameMatches ||
        !iotdevicenameMatches[1] || !iotdevicesecretMatches ||
        !iotdevicesecretMatches[1]) {
      return false;
    }

    const iothub = iothubMatches[1];
    const iotdevicename = iotdevicenameMatches[1];
    const iotdevicesecret = iotdevicesecretMatches[1];

    const data = {iothub, iotdevicename, iotdevicesecret};
    const uri = constants.accessEndpoint;

    const res = await this.setConfig(uri, data);

    return res;
  }

  async configUserData() {
    const deviceFolderPath = this.deviceFolder;

    if (!fs.existsSync(deviceFolderPath)) {
      throw new Error(`Device folder doesn't exist: ${deviceFolderPath}`);
    }

    const userjsonFilePath =
        path.join(deviceFolderPath, constants.userjsonFilename);

    if (!fs.existsSync(userjsonFilePath)) {
      throw new Error(`${userjsonFilePath} does not exist.`);
    }

    let userjson = {};

    try {
      userjson = require(userjsonFilePath);
    } catch (error) {
      userjson = {};
    }

    const data = {userjson: JSON.stringify(userjson)};
    const uri = constants.accessEndpoint;

    const res = await this.setConfig(uri, data);

    return res;
  }

  async configNtp() {
    const timeserver = await vscode.window.showInputBox({
      value: 'pool.ntp.org',
      prompt: `Time Server`,
      ignoreFocusOut: true,
      validateInput: (timeserver: string) => {
        if (!timeserver) {
          return 'Time Server cannot be empty.';
        } else {
          return;
        }
      }
    });

    if (timeserver === undefined) {
      return false;
    }

    const data = {timeserver};
    const uri = constants.accessEndpoint;

    const res = await this.setConfig(uri, data);

    return res;
  }

  async configSaveAndShutdown() {
    const data = {action: 'shutdown'};
    const uri = constants.accessEndpoint;

    const res = await this.setConfig(uri, data);

    return res;
  }
}