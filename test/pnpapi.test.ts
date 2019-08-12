'use strict';

import * as assert from 'assert';
import * as fs from 'fs-plus';
import * as path from 'path';
import * as vscode from 'vscode';

import {SearchResults} from '../src/DigitalTwin/DigitalTwinApi/DataContracts/SearchResults';
import {DigitalTwinMetamodelRepositoryClient} from '../src/DigitalTwin/DigitalTwinApi/DigitalTwinMetamodelRepositoryClient';

import {TestExtensionContext} from './stub';
import {DigitalTwinSharedAccessKey} from '../src/DigitalTwin/DigitalTwinApi/DigitalTwinSharedAccessKey';
import {DigitalTwinConnectionStringBuilder} from '../src/DigitalTwin/DigitalTwinApi/DigitalTwinConnectionStringBuilder';

const constants = {
  connectionString: '',
  sampleFolderPath:
      path.join(__dirname, '../../test/resources/PnPTestInputFiles'),
  sampleIntefaceName: 'MxChipInterface.json',
  sampleCapabilityModelName: 'MxChipCapabilityModel.json'
};

suite('IoT Workbench: PnPAPI', () => {
  test('Should be able generate shared access key', async function() {
    const context = new TestExtensionContext();
    this.timeout(60 * 1000);

    const pnpSharedAccessKey = new DigitalTwinSharedAccessKey(
        DigitalTwinConnectionStringBuilder.create(constants.connectionString));

    const result = pnpSharedAccessKey.generateSASToken();
    assert.equal(result.length > 0, true);
  });

  // tslint:disable-next-line: only-arrow-functions
  test('Should be able to get all Interfaces', async function() {
    const context = new TestExtensionContext();
    this.timeout(60 * 1000);

    const builder =
        DigitalTwinConnectionStringBuilder.create(constants.connectionString);
    const pnpMetamodelRepositoryClient =
        new DigitalTwinMetamodelRepositoryClient();
    await pnpMetamodelRepositoryClient.initialize(constants.connectionString);
    const result = await pnpMetamodelRepositoryClient.searchInterfacesAsync(
        '', null, builder.repositoryIdValue, 50);
    assert.equal(result.results.length <= 50, true);
    assert.equal(result.results.length >= 0, true);

    if (result && result.continuationToken) {
      const newResult =
          await pnpMetamodelRepositoryClient.searchInterfacesAsync(
              '', result.continuationToken, builder.repositoryIdValue, 50);
      assert.equal(newResult.results.length <= 50, true);
      assert.equal(newResult.results.length > 0, true);
    }
  });

  test('should be able to get the Interface content', async function() {
    this.timeout(10 * 60 * 1000);
    const pnpMetamodelRepositoryClient =
        new DigitalTwinMetamodelRepositoryClient();
    await pnpMetamodelRepositoryClient.initialize(null);
    const searchResults: SearchResults =
        await pnpMetamodelRepositoryClient.searchInterfacesAsync(
            '', null, undefined, 50);

    if (searchResults.results.length > 0) {
      const sampleUri = searchResults.results[0].urnId;
      // get the Interface by interfaceId.
      const interfaceContext =
          await pnpMetamodelRepositoryClient.getInterfaceAsync(
              sampleUri, undefined, true);

      assert.equal(interfaceContext.content !== null, true);
    }

    const fakeModelId = 'urn:1223:123:mxchip:1234';
    try {
      await pnpMetamodelRepositoryClient.getInterfaceAsync(
          fakeModelId, undefined, false);
      throw new Error('should not happen');
    } catch (error) {
      assert.equal(error.statusCode, 404);
    }
  });

  test('should be able to get the Capability Model content', async function() {
    this.timeout(10 * 60 * 1000);
    const builder =
        DigitalTwinConnectionStringBuilder.create(constants.connectionString);
    const pnpMetamodelRepositoryClient =
        new DigitalTwinMetamodelRepositoryClient();
    await pnpMetamodelRepositoryClient.initialize(constants.connectionString);
    const searchResults: SearchResults =
        await pnpMetamodelRepositoryClient.searchCapabilityModelsAsync(
            '', null, builder.repositoryIdValue, 50);

    if (searchResults.results.length > 0) {
      const sampleUri = searchResults.results[0].urnId;
      // get the Interface.
      const templateContext =
          await pnpMetamodelRepositoryClient.getCapabilityModelAsync(
              sampleUri, builder.repositoryIdValue, true);
      assert.equal(templateContext.content !== null, true);

      const templateContext2 =
          await pnpMetamodelRepositoryClient.getCapabilityModelAsync(
              sampleUri, builder.repositoryIdValue, false);
      assert.equal(templateContext2.content !== null, true);
    }
  });

  test('should be able to create and delete Interface', async function() {
    this.timeout(60 * 1000);
    const builder =
        DigitalTwinConnectionStringBuilder.create(constants.connectionString);
    const pnpMetamodelRepositoryClient =
        new DigitalTwinMetamodelRepositoryClient();
    await pnpMetamodelRepositoryClient.initialize(constants.connectionString);
    const sampleInterfacePath =
        path.join(constants.sampleFolderPath, constants.sampleIntefaceName);

    const data = fs.readFileSync(sampleInterfacePath, 'utf8');
    assert.equal(data.length > 0, true);

    const newinteface =
        data.replace('1.0.0', `1.0.${Math.floor(Math.random() * 1000000)}`);

    const fileJson = JSON.parse(newinteface);
    const fileId = fileJson['@id'];
    const result =
        await pnpMetamodelRepositoryClient.createOrUpdateInterfaceAsync(
            newinteface, fileId, undefined, builder.repositoryIdValue);

    assert.equal(result.length > 0, true);

    const interfaceContext =
        await pnpMetamodelRepositoryClient.getInterfaceAsync(
            fileId, builder.repositoryIdValue, true);

    const updatedResult =
        await pnpMetamodelRepositoryClient.createOrUpdateInterfaceAsync(
            newinteface, fileId, interfaceContext.etag,
            builder.repositoryIdValue);

    assert.equal(updatedResult !== result, true);

    await pnpMetamodelRepositoryClient.deleteInterfaceAsync(
        fileId, builder.repositoryIdValue);
    if (fileId) {
      try {
        await pnpMetamodelRepositoryClient.getInterfaceAsync(
            fileId, builder.repositoryIdValue, true);
      } catch (error) {
        assert.equal(error.statusCode, 404);
      }
    }
  });
});
