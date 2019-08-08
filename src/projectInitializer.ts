// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import * as utils from './utils';

import {TelemetryContext} from './telemetry';
import {FileNames, ScaffoldType, PlatformType, TemplateTag} from './constants';
import {IoTWorkbenchSettings} from './IoTSettings';
import {FileUtility} from './FileUtility';
import {ProjectTemplate, ProjectTemplateType, TemplatesType} from './Models/Interfaces/ProjectTemplate';
import {Platform} from './Models/Interfaces/Platform';
import {RemoteExtension} from './Models/RemoteExtension';

const impor = require('impor')(__dirname);
const ioTWorkspaceProjectModule = impor('./Models/IoTWorkspaceProject') as
    typeof import('./Models/IoTWorkspaceProject');
const ioTContainerizedProjectModule =
    impor('./Models/IoTContainerizedProject') as
    typeof import('./Models/IoTContainerizedProject');

const constants = {
  defaultProjectName: 'IoTproject',
  noDeviceMessage: '$(issue-opened) My device is not in the list...',
  embeddedLinuxProjectName: 'Embedded Linux Project'
};

export class ProjectInitializer {
  async InitializeProject(
      context: vscode.ExtensionContext, channel: vscode.OutputChannel,
      telemetryContext: TelemetryContext) {
    // Only create project when not in remote environment
    const notRemote = RemoteExtension.checkNotRemoteBeforeRunCommand(context);
    if (!notRemote) {
      return;
    }

    let openInNewWindow = false;
    // If current window contains other project, open the created project in new
    // window.
    if (vscode.workspace.workspaceFolders &&
        vscode.workspace.workspaceFolders.length > 0) {
      openInNewWindow = true;
    }

    // Initial project
    await vscode.window.withProgress(
        {
          title: 'Project initialization',
          location: vscode.ProgressLocation.Window,
        },
        async (progress) => {
          progress.report({
            message: 'Updating a list of available template',
          });

          try {
            const scaffoldType = ScaffoldType.Local;

            // Step 1: Get project name
            const projectPath = await this.GenerateProjectFolder(scaffoldType);
            if (!projectPath) {
              telemetryContext.properties.errorMessage =
                  'Project name input cancelled.';
              telemetryContext.properties.result = 'Cancelled';
              return;
            } else {
              telemetryContext.properties.projectPath = projectPath;
            }

            // Step 2: Select platform
            const platformSelection =
                await this.SelectPlatform(scaffoldType, context);
            if (!platformSelection) {
              telemetryContext.properties.errorMessage =
                  'Platform selection cancelled.';
              telemetryContext.properties.result = 'Cancelled';
              return;
            } else {
              telemetryContext.properties.platform = platformSelection.label;
            }

            // Step 3: Select template
            let template: ProjectTemplate|undefined;
            const resourceRootPath = context.asAbsolutePath(path.join(
                FileNames.resourcesFolderName, FileNames.templatesFolderName));
            const templateJsonFilePath =
                path.join(resourceRootPath, FileNames.templateFileName);
            const templateJsonFileString =
                await FileUtility.readFile(
                    scaffoldType, templateJsonFilePath, 'utf8') as string;
            const templateJson = JSON.parse(templateJsonFileString);
            if (!templateJson) {
              throw new Error(`Fail to load template json.`);
            }

            let templateName: string|undefined;
            if (platformSelection.label === PlatformType.ARDUINO) {
              const templateSelection = await this.SelectTemplate(
                  telemetryContext, templateJson, PlatformType.ARDUINO);

              if (!templateSelection) {
                telemetryContext.properties.errorMessage =
                    'Project template selection cancelled.';
                telemetryContext.properties.result = 'Cancelled';
                return;
              } else {
                telemetryContext.properties.template = templateSelection.label;
                if (templateSelection.label === constants.noDeviceMessage) {
                  await utils.TakeNoDeviceSurvey(telemetryContext);
                  return;
                }
              }
              templateName = templateSelection.label;
            } else {
              // If choose Embedded Linux platform, generate C project template
              // directly
              templateName = constants.embeddedLinuxProjectName;
            }

            template =
                templateJson.templates.find((template: ProjectTemplate) => {
                  return template.platform === platformSelection.label &&
                      template.name === templateName;
                });
            if (!template) {
              throw new Error(
                  `Fail to find the wanted project template in template json file.`);
            }

            // Step 4: Load the list of template files
            const projectTemplateType: ProjectTemplateType =
                (ProjectTemplateType)
                    [template.type as keyof typeof ProjectTemplateType];

            const templateFolder = path.join(resourceRootPath, template.path);
            const templateFilesInfo =
                await utils.getTemplateFilesInfo(templateFolder);

            let project;
            if (template.platform === PlatformType.EMBEDDEDLINUX) {
              telemetryContext.properties.projectHostType = 'Container';
              project =
                  new ioTContainerizedProjectModule.IoTContainerizedProject(
                      context, channel, telemetryContext);
            } else if (template.platform === PlatformType.ARDUINO) {
              telemetryContext.properties.projectHostType = 'Workspace';
              project = new ioTWorkspaceProjectModule.IoTWorkspaceProject(
                  context, channel, telemetryContext);
            } else {
              throw new Error('unsupported platform');
            }
            return await project.create(
                projectPath, templateFilesInfo, projectTemplateType,
                template.boardId, openInNewWindow);
          } catch (error) {
            throw error;
          }
        });
  }

  private async SelectTemplate(
      telemetryContext: TelemetryContext, templateJson: TemplatesType,
      platform: string): Promise<vscode.QuickPickItem|undefined> {
    const result =
        templateJson.templates.filter((template: ProjectTemplate) => {
          return (
              template.platform === platform &&
              template.tag === TemplateTag.general);
        });

    const projectTemplateList: vscode.QuickPickItem[] = [];

    result.forEach((element: ProjectTemplate) => {
      projectTemplateList.push({
        label: element.name,
        description: element.description,
        detail: element.detail
      });
    });

    const templateSelection =
        await vscode.window.showQuickPick(projectTemplateList, {
          ignoreFocusOut: true,
          matchOnDescription: true,
          matchOnDetail: true,
          placeHolder: 'Select a project template'
        });

    return templateSelection;
  }

  private async SelectPlatform(
      type: ScaffoldType, context: vscode.ExtensionContext):
      Promise<vscode.QuickPickItem|undefined> {
    const platformListPath = context.asAbsolutePath(path.join(
        FileNames.resourcesFolderName, FileNames.templatesFolderName,
        FileNames.platformListFileName));
    const platformListJsonString =
        await FileUtility.readFile(type, platformListPath, 'utf8') as string;
    const platformListJson = JSON.parse(platformListJsonString);

    if (!platformListJson) {
      throw new Error('Fail to load platform list.');
    }

    const platformList: vscode.QuickPickItem[] = [];

    platformListJson.platforms.forEach((platform: Platform) => {
      platformList.push(
          {label: platform.name, description: platform.description});
    });

    const platformSelection = await vscode.window.showQuickPick(platformList, {
      ignoreFocusOut: true,
      matchOnDescription: true,
      matchOnDetail: true,
      placeHolder: 'Select a platform',
    });

    return platformSelection;
  }

  private async GenerateProjectFolder(scaffoldType: ScaffoldType):
      Promise<string|undefined> {
    // Get default workbench path.
    const settings: IoTWorkbenchSettings =
        await IoTWorkbenchSettings.createAsync();
    const workbench = await settings.workbenchPath();

    const projectRootPath = path.join(workbench, 'projects');
    if (!await FileUtility.directoryExists(scaffoldType, projectRootPath)) {
      await FileUtility.mkdirRecursively(scaffoldType, projectRootPath);
    }

    let counter = 0;
    const name = constants.defaultProjectName;
    let candidateName = name;
    while (true) {
      const projectPath = path.join(projectRootPath, candidateName);
      const isValid = this.IsProjectPathValid(scaffoldType, projectPath);
      if (isValid) {
        break;
      }

      counter++;
      candidateName = `${name}_${counter}`;
    }

    const projectName = await vscode.window.showInputBox({
      value: candidateName,
      prompt: 'Input project name.',
      ignoreFocusOut: true,
      validateInput: async (projectName: string) => {
        if (!/^([a-z0-9_]|[a-z0-9_][-a-z0-9_.]*[a-z0-9_])(\.ino)?$/i.test(
                projectName)) {
          return 'Project name can only contain letters, numbers, "-" and ".", and cannot start or end with "-" or ".".';
        }

        const projectPath = path.join(projectRootPath, projectName);
        const isProjectNameValid =
            this.IsProjectPathValid(scaffoldType, projectPath);
        if (isProjectNameValid) {
          return;
        } else {
          return `${projectPath} exists, please choose another name.`;
        }
      }
    });

    const projectPath =
        projectName ? path.join(projectRootPath, projectName) : undefined;

    // We don't create the projectpath here in case user may cancel their
    // initialization in following steps Just generate a valid path for project
    return projectPath;
  }

  private async IsProjectPathValid(
      scaffoldType: ScaffoldType, projectPath: string): Promise<boolean> {
    const projectPathExists =
        await FileUtility.fileExists(scaffoldType, projectPath);
    const projectDirectoryExists =
        await FileUtility.directoryExists(scaffoldType, projectPath);
    return !projectPathExists && !projectDirectoryExists;
  }
}
