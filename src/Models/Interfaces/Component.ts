// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

export enum ComponentType {
  Device = "Device",
  IoTHub = "IoTHub",
  AzureFunctions = "AzureFunctions",
  IoTHubDevice = "IoTHubDevice"
}

export interface Component {
  name: string;
  id: string;
  load(): Promise<void>;
  create(): Promise<void>;
  checkPrerequisites(operation: string): Promise<void>;
  getComponentType(): ComponentType;
}
