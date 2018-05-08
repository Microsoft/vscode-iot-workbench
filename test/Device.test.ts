import * as assert from 'assert';
import * as Path from 'path';
import * as vscode from 'vscode';

import {DeviceOperator} from '../src/DeviceOperator';
import {AZ3166Device} from '../src/Models/AZ3166Device';
import {ComponentType} from '../src/Models/Interfaces/Component';
import {Device, DeviceType} from '../src/Models/Interfaces/Device';
import {TelemetryContext} from '../src/telemetry';

import {TestExtensionContext} from './stub';

suite('IoT Workbench: AZ3166Device', () => {
  // tslint:disable-next-line: only-arrow-functions
  test('property of AZ3166 device should be set correctly', function(done) {
    const context = new TestExtensionContext();
    const device = new AZ3166Device(context, '', 'emptySketch.ino');
    assert.equal(device.getDeviceType(), DeviceType.MXChip_AZ3166);
    assert.equal(device.getComponentType(), ComponentType.Device);
    done();
  });

  test('should be able to run device compile', function(done) {
    this.timeout(10 * 60 * 1000);
    try {
      const deviceOperator = new DeviceOperator();
      const contextMock = new TestExtensionContext();

      const telemetryContext: TelemetryContext = {
        properties: {result: 'Succeeded', error: '', errorMessage: ''},
        measurements: {duration: 0}
      };
      const outputChannel: vscode.OutputChannel =
          vscode.window.createOutputChannel('Azure IoT Workbench Test');
      deviceOperator.compile(contextMock, outputChannel, telemetryContext)
          .then(() => {
            done();
          });
    } catch (error) {
      done(new Error(error));
    }
  });
});