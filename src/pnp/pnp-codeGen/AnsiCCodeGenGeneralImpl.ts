import * as vscode from 'vscode';
import {AnsiCCodeGeneratorBase} from './Interfaces/AnsiCCodeGeneratorBase';

export class AnsiCCodeGenGeneralImpl extends AnsiCCodeGeneratorBase {
  constructor(context: vscode.ExtensionContext, channel: vscode.OutputChannel) {
    super(context, channel);
  }

  async GenerateCode(
      targetPath: string, filePath: string, fileCoreName: string,
      connectionString: string): Promise<boolean> {
    // Invoke PnP toolset to generate the code
    const retvalue = await this.GenerateAnsiCCodeCore(
        targetPath, filePath, connectionString);
    if (retvalue) {
      await vscode.commands.executeCommand(
          'vscode.openFolder', vscode.Uri.file(targetPath), true);
    }
    return retvalue;
  }
}