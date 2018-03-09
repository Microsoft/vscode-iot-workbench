//
// Note: This example test is leveraging the Mocha test framework.
// Please refer to their documentation on https://mochajs.org/ for help.
//

// The module 'assert' provides assertion methods from node
import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import * as myExtension from '../src/extension';

// Defines a Mocha test suite to group tests of similar kind together
suite('IoT Workbench Tests', () => {
  test('should be present', () => {
    assert.ok(
        vscode.extensions.getExtension('vsciot-vscode.vscode-iot-workbench'));
  });

  // tslint:disable-next-line:only-arrow-functions
  test('should be able to activate the extension', function(done) {
    this.timeout(60 * 1000);
    const extension =
        vscode.extensions.getExtension('vsciot-vscode.vscode-iot-workbench');
    if (!extension) {
      done('Failed to activate extension');
    } else if (!extension.isActive) {
      extension.activate().then(
          (api) => {
            done();
          },
          () => {
            done('Failed to activate extension');
          });
    } else {
      done();
    }
  });
});