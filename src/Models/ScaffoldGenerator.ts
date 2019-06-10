'use strict';

import * as fs from 'fs-plus';
import * as path from 'path';
import {FileNames, ScaffoldType} from '../constants';
import {FileUtility} from '../FileUtility';

export class ScaffoldGenerator {
  /**
   * Generate common files like .iotworkbenchproject file, .vscode folder, .devcontainer folder
   * @param type Scaffold type. 'local' - scaffold files with local path; 'workspace' - scaffold files with workspace path
   */
  private async generateCommonFiles(type: ScaffoldType, projectFolder: string, vscodeFolderPath: string, devcontainerFolderPath: string): Promise<boolean> {
    if (!await FileUtility.exists(type, projectFolder)) {
      throw new Error('Unable to find the project folder.');
    }

    try {
      const iotworkbenchprojectFilePath =
          path.join(projectFolder, FileNames.iotworkbenchprojectFileName);
      await FileUtility.writeFile(type, iotworkbenchprojectFilePath, ' ');
    } catch (error) {
      throw new Error(
          `Create ${FileNames.iotworkbenchprojectFileName} file failed: ${error.message}`);
    }

    if (!await FileUtility.exists(type, vscodeFolderPath)) {
      try {
        await FileUtility.mkdirRecursively(type, vscodeFolderPath);
      } catch (error) {
        throw new Error(`Failed to create folder ${vscodeFolderPath}. Error message: ${error.message}`);
      }
    }

    if (!await FileUtility.exists(type, devcontainerFolderPath)) {
      try {
        await FileUtility.mkdirRecursively(type, devcontainerFolderPath);
      } catch (error) {
        throw new Error(`Failed to create folder ${devcontainerFolderPath}. Error message: ${error.message}`);
      }
    }

    return true;
  }
  
  /**
   * Create c_cpp_properties.json file
   */
  private async generateCppPropertiesFile(type: ScaffoldType, vscodeFolderPath: string, boardFolderPath: string, boardId: string): Promise<boolean> {

    const cppPropertiesFilePath =
        path.join(vscodeFolderPath, FileNames.cppPropertiesFileName);

    if (await FileUtility.exists(type, cppPropertiesFilePath)) {
      return true;
    }

    try {
      const propertiesSourceFile = path.join(
        boardFolderPath, boardId, FileNames.cppPropertiesFileName);
      const propertiesContent =
          fs.readFileSync(propertiesSourceFile).toString();
      if (!await FileUtility.exists(type, vscodeFolderPath)) {
        await FileUtility.mkdirRecursively(type, vscodeFolderPath);
      }
      await FileUtility.writeFile(type, cppPropertiesFilePath, propertiesContent);
    } catch (error) {
      throw new Error(`Create ${FileNames.cppPropertiesFileName} failed: ${error.message}`);
    }

    return true;
  }

  /**
   * Create Dockerfile & devcontainer.json
   */
  private async generateDockerRelatedFiles(type: ScaffoldType, devcontainerFolderPath: string, boardFolderPath: string, boardId: string): Promise<boolean> {
    // Dockerfile
    const dockerfileTargetPath = path.join(
      devcontainerFolderPath, FileNames.dockerfileName);
    if (!await FileUtility.exists(type, devcontainerFolderPath)) {
      await FileUtility.mkdirRecursively(type, devcontainerFolderPath);
    }

    if (await FileUtility.exists(type, dockerfileTargetPath)) {
      return true;
    }

    try {
      const dockerfileSourcePath = path.join(
        boardFolderPath, boardId, FileNames.dockerfileName);
      const dockerfileContent = fs.readFileSync(dockerfileSourcePath, 'utf8');
      await FileUtility.writeFile(type, dockerfileTargetPath, dockerfileContent);
    } catch (error) {
      throw new Error(`Create ${FileNames.dockerfileName} failed: ${error.message}`);
    }

    // devcontainer.json
    const devcontainerJsonFileTargetPath = path.join(
      devcontainerFolderPath, FileNames.devcontainerJsonFileName);

    if (await FileUtility.exists(type, devcontainerJsonFileTargetPath)) {
      return true;
    }

    try {
      const devcontainerJsonFileSourcePath = path.join(
        boardFolderPath, boardId, FileNames.devcontainerJsonFileName);
      const devcontainerJSONContent = fs.readFileSync(devcontainerJsonFileSourcePath, 'utf8');
      await FileUtility.writeFile(type, devcontainerJsonFileTargetPath, devcontainerJSONContent);
    } catch (error) {
      throw new Error(`Create ${FileNames.devcontainerJsonFileName} file failed: ${error.message}`);
    }

    return true;
  }

  async scaffoldIoTProjectdFiles(type: ScaffoldType, projectFolder: string, vscodeFolderPath: string, boardFolderPath: string, devcontainerFolderPath: string, boardId: string) {
    try {
      await this.generateCommonFiles(type, projectFolder, vscodeFolderPath, devcontainerFolderPath);
      await this.generateCppPropertiesFile(type, vscodeFolderPath, boardFolderPath, boardId);
      await this.generateDockerRelatedFiles(type, devcontainerFolderPath, boardFolderPath, boardId);
    } catch (error) {
      throw new Error(`Scaffold files for IoT Project failed. ${error.message}`);
    }
  }
}