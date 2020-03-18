import * as vscode from "vscode";
import { ExtensionName } from "./Interfaces/Api";
import { WorkbenchExtension } from "../WorkbenchExtension";
import { RemoteEnvNotSupportedError } from "../common/Error/OperationFailedErrors/RemoteEnvNotSupportedError";
import { OperationFailedError } from "../common/Error/OperationFailedErrors/OperationFailedError";
import { checkExtensionAvailable } from "./Apis";
import { DependentExtensionNotFoundError } from "../common/Error/OperationFailedErrors/DependentExtensionNotFoundError";

export class RemoteExtension {
  static isRemote(context: vscode.ExtensionContext): boolean {
    const extension = WorkbenchExtension.getExtension(context);
    if (!extension) {
      throw new OperationFailedError("check whether is remote", "Failed to get workbench extension", "");
    }
    return extension.extensionKind === vscode.ExtensionKind.Workspace;
  }

  /**
   * Check whether remote extension is installed in VS Code.
   * If not, ask user to install it from marketplace.
   * @returns true - remote extension is installed.
   * @returns false - remote extension is not installed.
   */
  static async isAvailable(): Promise<boolean> {
    return await checkExtensionAvailable(ExtensionName.Remote);
  }

  static async checkRemoteExtension(operation: string): Promise<void> {
    const res = await RemoteExtension.isAvailable();
    if (!res) {
      throw new DependentExtensionNotFoundError(operation, ExtensionName.Remote);
    }
  }

  /**
   * Ensure we are not in remote environment before running a command.
   * If in remote environment, throw error.
   */
  static ensureLocalBeforeRunCommand(operation: string, context: vscode.ExtensionContext): void {
    if (RemoteExtension.isRemote(context)) {
      throw new RemoteEnvNotSupportedError(operation);
    }
  }
}
