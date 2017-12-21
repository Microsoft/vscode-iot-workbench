import * as vscode from 'vscode';

import {ExceptionHelper} from '../exceptionHelper';

import {Component, ComponentType} from './Interfaces/Component';
import {Device, DeviceType} from './Interfaces/Device';

export class AZ3166Device implements Device {
  private deviceType: DeviceType;
  private componentType: ComponentType;
  private deviceFolder: string;

  constructor(devicePath: string) {
    this.deviceType = DeviceType.MXChip_AZ3166;
    this.componentType = ComponentType.Device;
    this.deviceFolder = devicePath;
  }

  getDeviceType(): DeviceType {
    return this.deviceType;
  }

  getComponentType(): ComponentType {
    return this.componentType;
  }

  load(): boolean {
    return true;
  }

  create(): boolean {
    return true;
  }

  async compile(): Promise<boolean> {
    return new Promise(
        async (
            resolve: (value: boolean) => void,
            reject: (value: boolean) => void) => {
          try {
            vscode.commands.executeCommand(
                'arduino.iotStudioInitialize', this.deviceFolder);
            await vscode.commands.executeCommand('arduino.verify');
            resolve(true);
          } catch (error) {
            ExceptionHelper.logError(error, true);
            reject(false);
          }
        });
  }

  async upload(): Promise<boolean> {
    return new Promise(
        async (
            resolve: (value: boolean) => void,
            reject: (value: boolean) => void) => {
          try {
            vscode.commands.executeCommand(
                'arduino.iotStudioInitialize', this.deviceFolder);
            await vscode.commands.executeCommand('arduino.upload');
            resolve(true);
          } catch (error) {
            ExceptionHelper.logError(error, true);
            reject(false);
          }
        });
  }
}
