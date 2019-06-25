// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import * as vscode from 'vscode';

import { IoTWorkbenchProjectBase } from './IoTWorkbenchProjectBase';
import { TelemetryContext } from '../telemetry';
import { ProjectTemplate } from './Interfaces/ProjectTemplate';

export class IoTContainerizedProject extends IoTWorkbenchProjectBase {

  constructor(
      context: vscode.ExtensionContext, channel: vscode.OutputChannel,
      telemetryContext: TelemetryContext) {
    super(context, channel, telemetryContext)
  }

  async load(initLoad = false): Promise<boolean> {
    return false;
  }

  async compile(): Promise<boolean>{
    return false;
  }

  async upload(): Promise<boolean>{
    return false;
  }

  async provision(): Promise<boolean>{
    return false;
  }

  async deploy(): Promise<boolean>{
    return false;
  }

  async create(
    rootFolderPath: string, projectTemplateItem: ProjectTemplate,
    boardId: string, openInNewWindow: boolean): Promise<boolean>{
      return false;
    }

}