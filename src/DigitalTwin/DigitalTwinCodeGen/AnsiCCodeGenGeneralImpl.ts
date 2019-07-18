import * as path from 'path';
import * as vscode from 'vscode';

import {FileNames, ScaffoldType} from '../../constants';
import {TelemetryContext} from '../../telemetry';
import {generateTemplateFile, GetCodeGenTemplateFolderName, getTemplateFilesInfo} from '../../utils';

import {AnsiCCodeGeneratorBase} from './Interfaces/AnsiCCodeGeneratorBase';
import {CodeGenProjectType, DeviceConnectionType} from './Interfaces/CodeGenerator';

export class AnsiCCodeGenGeneralImpl extends AnsiCCodeGeneratorBase {
  constructor(
      context: vscode.ExtensionContext, channel: vscode.OutputChannel,
      private telemetryContext: TelemetryContext,
      private provisionType: DeviceConnectionType) {
    super(context, channel);
  }

  async GenerateCode(
      targetPath: string, filePath: string, capabilityModelName: string,
      interfaceDir: string): Promise<boolean> {
    // Invoke DigitalTwinCodeGen toolset to generate the code
    const retvalue =
        await this.GenerateAnsiCCodeCore(targetPath, filePath, interfaceDir);

    const templateFolderName = await GetCodeGenTemplateFolderName(
        this.context, CodeGenProjectType.CMake, this.provisionType);
    if (!templateFolderName) {
      throw new Error(`Fail to get template folder name`);
    }

    const templateFolder = this.context.asAbsolutePath(path.join(
        FileNames.resourcesFolderName, FileNames.templatesFolderName,
        templateFolderName));
    const templateFilesInfo = await getTemplateFilesInfo(templateFolder);

    const projectName = path.basename(targetPath);

    const projectNamePattern = /{PROJECT_NAME}/g;

    for (const fileInfo of templateFilesInfo) {
      if (fileInfo.fileContent === undefined) {
        continue;
      }

      fileInfo.fileContent =
          fileInfo.fileContent.replace(projectNamePattern, projectName);
      await generateTemplateFile(targetPath, ScaffoldType.Local, fileInfo);
    }

    if (retvalue) {
      await vscode.commands.executeCommand(
          'vscode.openFolder', vscode.Uri.file(targetPath), true);
    }
    return retvalue;
  }
}