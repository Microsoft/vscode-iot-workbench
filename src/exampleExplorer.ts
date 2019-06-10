// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import * as fs from 'fs-plus';
import * as path from 'path';
import * as vscode from 'vscode';
import AdmZip = require('adm-zip');
import {IoTWorkbenchSettings} from './IoTSettings';
import * as utils from './utils';
import {Board, BoardQuickPickItem} from './Models/Interfaces/Board';
import {TelemetryContext} from './telemetry';
import {FileNames, PlatformType, ScaffoldType} from './constants';
import {ArduinoPackageManager} from './ArduinoPackageManager';
import {BoardProvider} from './boardProvider';
import {VSCExpress} from 'vscode-express';
import {FileUtility} from './FileUtility';

type OptionsWithUri = import('request-promise').OptionsWithUri;

const impor = require('impor')(__dirname);
const request = impor('request-promise') as typeof import('request-promise');

export class ExampleExplorer {
  private _exampleName = '';
  private _exampleUrl = '';
  private _boardId = '';

  private static _vscexpress: VSCExpress|undefined;

  private async moveTempFiles(fsPath: string) {
    const tempPath = path.join(fsPath, '.temp');
    const tempPathList = fs.listSync(tempPath);
    let examplePath: string|undefined = undefined;
    for (let i = 0; i < tempPathList.length; i++) {
      if (!/\.zip$/.test(tempPathList[i])) {
        examplePath = tempPathList[i];
        break;
      }
    }
    if (!examplePath) {
      return false;
    }

    const examplePathList = fs.readdirSync(examplePath);

    examplePathList.forEach(item => {
      if (item !== '.' && item !== '..') {
        try {
          fs.moveSync(
              path.join(examplePath as string, item), path.join(fsPath, item));
        } catch (error) {
          throw error;
        }
      }
    });

    try {
      fs.removeSync(tempPath);
    } catch (error) {
      throw error;
    }

    return true;
  }

  private async downloadExamplePackage(
      context: vscode.ExtensionContext, channel: vscode.OutputChannel,
      url: string, fsPath: string): Promise<boolean> {
    channel.show();
    const loading = setInterval(() => {
      channel.append('.');
    }, 1000);

    const options: OptionsWithUri = {
      method: 'GET',
      uri: url,
      encoding: null  // Binary data
    };

    const zipData = await request(options).promise() as string;
    const tempPath = path.join(fsPath, '.temp');
    fs.writeFileSync(path.join(tempPath, 'example.zip'), zipData);
    const zip = new AdmZip(path.join(tempPath, 'example.zip'));
    try {
      zip.extractAllTo(tempPath, true);
      clearInterval(loading);
      channel.appendLine('');
      channel.appendLine('Example loaded.');
      await this.moveTempFiles(fsPath);
      return true;
    } catch (error) {
      clearInterval(loading);
      channel.appendLine('');
      throw error;
    }
  }

  private async GenerateExampleFolder(exampleName: string, context: vscode.ExtensionContext) {
    const settings: IoTWorkbenchSettings = await IoTWorkbenchSettings.createAsync();
    const workbench = await settings.workbenchPath();

    const name = path.join(workbench, 'examples', exampleName);
    if (!await FileUtility.fileExists(ScaffoldType.local, name) && !await FileUtility.directoryExists(ScaffoldType.local, name)) {
      await FileUtility.mkdirRecursively(ScaffoldType.local, name);
      return name;
    }

    // TODO: Here may be blocked. fs.listSync should be replaced to FileUtility.listInLocal
    const workspaceFiles =
        fs.listSync(name, [FileNames.workspaceExtensionName]);
    if (workspaceFiles && workspaceFiles.length > 0) {
      const workspaceFile = workspaceFiles[0];  // just pick the first one
      if (await FileUtility.exists(ScaffoldType.local, workspaceFile)) {
        const selection = await vscode.window.showQuickPick(
            [
              {
                label: `Open an existing example`,
                description: '',
                detail: `Example exists: ${name}`
              },
              {
                label: 'Generate a new example',
                description: '',
                detail: 'Create a new folder to generate the example'
              }
            ],
            {
              ignoreFocusOut: true,
              matchOnDescription: true,
              matchOnDetail: true,
              placeHolder: 'Select an option',
            });

        if (!selection) {
          return '';
        }

        if (selection.label === 'Open an existing example') {
          return name;
        }
      }
    }

    const customizedName = await vscode.window.showInputBox({
      prompt: 'Input example folder name',
      ignoreFocusOut: true,
      validateInput: async (exampleName: string) => {
        if (exampleName === null) {
          return;
        }
        const name = path.join(workbench, 'examples', exampleName);
        if (! await FileUtility.fileExists(ScaffoldType.local, name) && !await FileUtility.directoryExists(ScaffoldType.local, name)) {
          if (!/^([a-z0-9_]|[a-z0-9_][-a-z0-9_.]*[a-z0-9_])$/i.test(
                  exampleName)) {
            return 'Folder name can only contain letters, numbers, "-" and ".", and cannot start or end with "-" or ".".';
          }
          return;
        } else {
          const items = fs.listSync(name);
          if (items.length === 0) {
            return;
          }
          return `${exampleName} exists, please use other folder name.`;
        }
      }
    });

    if (!customizedName) {
      return '';
    }

    const customizedPath = path.join(workbench, 'examples', customizedName);
    if (!await FileUtility.fileExists(ScaffoldType.local, customizedPath) &&
        !await FileUtility.directoryExists(ScaffoldType.local, customizedPath)) {
      await FileUtility.mkdirRecursively(ScaffoldType.local, customizedPath);
    }

    return customizedPath;
  }

  async selectBoard(
      context: vscode.ExtensionContext, channel: vscode.OutputChannel,
      telemetryContext: TelemetryContext) {
    const boardFolderPath = context.asAbsolutePath(
        path.join(FileNames.resourcesFolderName, PlatformType.ARDUINO));
    const boardProvider = new BoardProvider(boardFolderPath);
    const boardItemList: BoardQuickPickItem[] = [];
    const boards = boardProvider.list.filter(board => board.exampleUrl);
    boards.forEach((board: Board) => {
      boardItemList.push({
        name: board.name,
        id: board.id,
        detailInfo: board.detailInfo,
        label: board.name,
        description: board.detailInfo,
      });
    });

    // add the selection of 'device not in the list'
    boardItemList.push({
      name: '',
      id: 'no_device',
      detailInfo: '',
      label: '$(issue-opened) My device is not in the list...',
      description: '',
    });

    const boardSelection = await vscode.window.showQuickPick(boardItemList, {
      ignoreFocusOut: true,
      matchOnDescription: true,
      matchOnDetail: true,
      placeHolder: 'Select a board',
    });

    if (!boardSelection) {
      telemetryContext.properties.errorMessage = 'Board selection canceled.';
      telemetryContext.properties.result = 'Canceled';
      return false;
    } else if (boardSelection.id === 'no_device') {
      await utils.TakeNoDeviceSurvey(telemetryContext);
      return;
    } else {
      telemetryContext.properties.board = boardSelection.label;
      const board = boardProvider.find({id: boardSelection.id});

      if (board) {
        // To avoid block example gallery, use async to install board here
        // await ArduinoPackageManager.installBoard(board);
        ArduinoPackageManager.installBoard(board);
        const exampleUrl = 'example.html?board=' + board.id +
            '&url=' + encodeURIComponent(board.exampleUrl || '');
        ExampleExplorer._vscexpress =
            ExampleExplorer._vscexpress || new VSCExpress(context, 'views');
        ExampleExplorer._vscexpress.open(
            exampleUrl, 'Examples - Azure IoT Device Workbench',
            vscode.ViewColumn.One, {
              enableScripts: true,
              enableCommandUris: true,
              retainContextWhenHidden: true
            });
        return true;
      }
    }

    return false;
  }

  async initializeExample(
      context: vscode.ExtensionContext, channel: vscode.OutputChannel,
      telemetryContext: TelemetryContext, name?: string, url?: string,
      boardId?: string) {
    try {
      if (name && url && boardId) {
        this._exampleName = name;
        this._exampleUrl = url;
        this._boardId = boardId;
      }
      const res = await this.initializeExampleInternal(
          context, channel, telemetryContext);

      if (res) {
        vscode.window.showInformationMessage('Example load successfully.');
      } else {
        vscode.window.showWarningMessage('Example load canceled.');
      }
    } catch (error) {
      vscode.window.showErrorMessage(
          'Unable to load example. Please check output window for detailed information.');
      throw error;
    }
  }

  setSelectedExample(name: string, url: string, boardId: string) {
    this._exampleName = name;
    this._exampleUrl = url;
    this._boardId = boardId;
  }

  private async initializeExampleInternal(
      context: vscode.ExtensionContext, channel: vscode.OutputChannel,
      telemetryContext: TelemetryContext): Promise<boolean> {
    if (!this._exampleName || !this._exampleUrl) {
      return false;
    }

    const boardList = context.asAbsolutePath(
        path.join(FileNames.resourcesFolderName, FileNames.boardListFileName));
    const boardsJson: {boards: Board[]} = require(boardList);

    telemetryContext.properties.Example = this._exampleName;
    const board = boardsJson.boards.find(board => board.id === this._boardId);
    telemetryContext.properties.board = board ? board.name : '';

    const url = this._exampleUrl;
    const fsPath = await this.GenerateExampleFolder(this._exampleName, context);

    if (!fsPath) {
      return false;
    }

    const items = fs.listSync(fsPath, [FileNames.workspaceExtensionName]);
    if (items.length !== 0) {
      await vscode.commands.executeCommand(
          'vscode.openFolder', vscode.Uri.file(items[0]), true);
      return true;
    }

    channel.appendLine('Downloading example package...');
    const res =
        await this.downloadExamplePackage(context, channel, url, fsPath);
    if (res) {
      // Follow the same pattern in Arduino extension to open examples in new
      // VSCode instance
      const workspaceFiles =
          fs.listSync(fsPath, [FileNames.workspaceExtensionName]);
      if (workspaceFiles && workspaceFiles.length > 0) {
        await vscode.commands.executeCommand(
            'vscode.openFolder', vscode.Uri.file(workspaceFiles[0]), true);
        return true;
      } else {
        // TODO: Add buttom to submit issue to iot-workbench repo.
        throw new Error(
            'The example does not contain a project for Azure IoT Device Workbench.');
      }
    } else {
      throw new Error(
          'Downloading example package failed. Please check your network settings.');
    }
  }
}