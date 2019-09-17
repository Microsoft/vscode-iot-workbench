import { DigitalTwinMetaModelContext } from './DigitalTwinMetaModelUtility';
import uniq = require('lodash.uniq');

const LANGUAGE_CODES = [
  'af',
  'af-ZA',
  'ar',
  'ar-AE',
  'ar-BH',
  'ar-DZ',
  'ar-EG',
  'ar-IQ',
  'ar-JO',
  'ar-KW',
  'ar-LB',
  'ar-LY',
  'ar-MA',
  'ar-OM',
  'ar-QA',
  'ar-SA',
  'ar-SY',
  'ar-TN',
  'ar-YE',
  'az',
  'az-AZ',
  'az-AZ',
  'be',
  'be-BY',
  'bg',
  'bg-BG',
  'bs-BA',
  'ca',
  'ca-ES',
  'cs',
  'cs-CZ',
  'cy',
  'cy-GB',
  'da',
  'da-DK',
  'de',
  'de-AT',
  'de-CH',
  'de-DE',
  'de-LI',
  'de-LU',
  'dv',
  'dv-MV',
  'el',
  'el-GR',
  'en',
  'en-AU',
  'en-BZ',
  'en-CA',
  'en-CB',
  'en-GB',
  'en-IE',
  'en-JM',
  'en-NZ',
  'en-PH',
  'en-TT',
  'en-US',
  'en-ZA',
  'en-ZW',
  'eo',
  'es',
  'es-AR',
  'es-BO',
  'es-CL',
  'es-CO',
  'es-CR',
  'es-DO',
  'es-EC',
  'es-ES',
  'es-ES',
  'es-GT',
  'es-HN',
  'es-MX',
  'es-NI',
  'es-PA',
  'es-PE',
  'es-PR',
  'es-PY',
  'es-SV',
  'es-UY',
  'es-VE',
  'et',
  'et-EE',
  'eu',
  'eu-ES',
  'fa',
  'fa-IR',
  'fi',
  'fi-FI',
  'fo',
  'fo-FO',
  'fr',
  'fr-BE',
  'fr-CA',
  'fr-CH',
  'fr-FR',
  'fr-LU',
  'fr-MC',
  'gl',
  'gl-ES',
  'gu',
  'gu-IN',
  'he',
  'he-IL',
  'hi',
  'hi-IN',
  'hr',
  'hr-BA',
  'hr-HR',
  'hu',
  'hu-HU',
  'hy',
  'hy-AM',
  'id',
  'id-ID',
  'is',
  'is-IS',
  'it',
  'it-CH',
  'it-IT',
  'ja',
  'ja-JP',
  'ka',
  'ka-GE',
  'kk',
  'kk-KZ',
  'kn',
  'kn-IN',
  'ko',
  'ko-KR',
  'kok',
  'kok-IN',
  'ky',
  'ky-KG',
  'lt',
  'lt-LT',
  'lv',
  'lv-LV',
  'mi',
  'mi-NZ',
  'mk',
  'mk-MK',
  'mn',
  'mn-MN',
  'mr',
  'mr-IN',
  'ms',
  'ms-BN',
  'ms-MY',
  'mt',
  'mt-MT',
  'nb',
  'nb-NO',
  'nl',
  'nl-BE',
  'nl-NL',
  'nn-NO',
  'ns',
  'ns-ZA',
  'pa',
  'pa-IN',
  'pl',
  'pl-PL',
  'ps',
  'ps-AR',
  'pt',
  'pt-BR',
  'pt-PT',
  'qu',
  'qu-BO',
  'qu-EC',
  'qu-PE',
  'ro',
  'ro-RO',
  'ru',
  'ru-RU',
  'sa',
  'sa-IN',
  'se',
  'se-FI',
  'se-FI',
  'se-FI',
  'se-NO',
  'se-NO',
  'se-NO',
  'se-SE',
  'se-SE',
  'se-SE',
  'sk',
  'sk-SK',
  'sl',
  'sl-SI',
  'sq',
  'sq-AL',
  'sr-BA',
  'sr-BA',
  'sr-SP',
  'sr-SP',
  'sv',
  'sv-FI',
  'sv-SE',
  'sw',
  'sw-KE',
  'syr',
  'syr-SY',
  'ta',
  'ta-IN',
  'te',
  'te-IN',
  'th',
  'th-TH',
  'tl',
  'tl-PH',
  'tn',
  'tn-ZA',
  'tr',
  'tr-TR',
  'tt',
  'tt-RU',
  'ts',
  'uk',
  'uk-UA',
  'ur',
  'ur-PK',
  'uz',
  'uz-UZ',
  'uz-UZ',
  'vi',
  'vi-VN',
  'xh',
  'xh-ZA',
  'zh',
  'zh-CN',
  'zh-HK',
  'zh-MO',
  'zh-SG',
  'zh-TW',
  'zu',
  'zu-ZA',
];

export interface GraphNode {
  Id: string;
  Value?: string;
}

export interface GraphEdge {
  SourceNode: GraphNode;
  TargetNode: GraphNode;
  Label: string;
}

export interface DigitalTwinMetaModelGraph {
  Nodes: GraphNode[];
  Edges: GraphEdge[];
}

export interface Map<T> {
  [key: string]: T;
}

export class DigitalTwinMetaModelParser {
  static LABEL = {
    DOMAIN: 'http://www.w3.org/2000/01/rdf-schema#domain',
    LABEL: 'http://www.w3.org/2000/01/rdf-schema#label',
    SUBCLASS: 'http://www.w3.org/2000/01/rdf-schema#subClassOf',
    RANGE: 'http://www.w3.org/2000/01/rdf-schema#range',
    TYPE: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
    COMMENT: 'http://www.w3.org/2000/01/rdf-schema#comment',
  };

  constructor(private graph: DigitalTwinMetaModelGraph) {}

  cache = {
    IdFromLabel: {} as Map<string>,
    PropertyNameFromId: {} as Map<string>,
    TypesFromId: {} as Map<string[]>,
    ValueTypesFromId: {} as Map<string[]>,
    StringValuesFromId: {} as Map<string[]>,
    PropertiesFromId: {} as Map<string[]>,
    CommnetFromId: {} as Map<string>,
    TypedPropertiesFromId: {} as Map<
      Array<{ label: string; required: boolean; type: string }>
    >,
    ShortNameFromLabel: {} as Map<string | null>,
  };

  getCommentFromId(id: string): string | undefined {
    if (this.cache.CommnetFromId[id] !== undefined) {
      return this.cache.CommnetFromId[id];
    }
    for (const edge of this.graph.Edges) {
      if (
        edge.SourceNode.Id === id &&
        edge.Label === DigitalTwinMetaModelParser.LABEL.COMMENT
      ) {
        this.cache.CommnetFromId[id] = edge.TargetNode.Value || '';
        return edge.TargetNode.Value;
      }
    }
    this.cache.CommnetFromId[id] = '';
    return undefined;
  }

  getIdFromShortName(
    dtContext: DigitalTwinMetaModelContext,
    shortName: string
  ): string | null {
    if (dtContext['@context'].hasOwnProperty(shortName)) {
      const shortNameValue = dtContext['@context'][shortName];
      if (typeof shortNameValue === 'string') {
        return dtContext['@context']['@vocab'] + shortNameValue;
      } else {
        return dtContext['@context']['@vocab'] + shortNameValue['@id'];
      }
    } else {
      return null;
    }
  }

  getIdFromLabel(
    dtContext: DigitalTwinMetaModelContext,
    label: string
  ): string | null {
    return dtContext['@context']['@vocab'] + label;
    // if (this.cache.IdFromLabel[type]) {
    //     return this.cache.IdFromLabel[type];
    // }

    // for (const edge of this.graph.Edges) {
    //     if (edge.Label === DigitalTwinMetaModelParser.LABEL.LABEL &&
    //     edge.TargetNode.Value === type) {
    //         this.cache.IdFromLabel[type] = edge.SourceNode.Id;
    //         return edge.SourceNode.Id;
    //     }
    // }

    // return null;
  }

  getIdFromType(
    dtContext: DigitalTwinMetaModelContext,
    type: string
  ): string | null {
    const value = dtContext['@context'][type];
    let label = '';
    if (value) {
      if (typeof value === 'string') {
        label = value;
      } else {
        label = value['@id'];
      }
    }

    if (!label) {
      label = type;
      console.log(`Cannot find label from type ${type}`);
    }

    return this.getIdFromLabel(dtContext, label);
  }

  getPropertyNameFromId(dtContext: DigitalTwinMetaModelContext, id: string) {
    if (this.cache.PropertyNameFromId[id]) {
      return this.cache.PropertyNameFromId[id];
    }
    const context = dtContext['@context'];
    const base = dtContext['@context']['@vocab'];
    for (const key of Object.keys(context)) {
      const item = context[key];
      const path: string = typeof item === 'string' ? item : item['@id'];
      if (base + path === id) {
        this.cache.PropertyNameFromId[id] = key;
        return key;
      }
    }

    console.log(`Connot get property name for ${id}`);
    return id;
  }

  getTypedPropertiesFromId(dtContext: DigitalTwinMetaModelContext, id: string) {
    if (this.cache.TypedPropertiesFromId[id]) {
      return this.cache.TypedPropertiesFromId[id];
    }

    const results: Array<{
      label: string;
      required: boolean;
      type: string;
    }> = [];

    if (this.isInternationalizationFromId(dtContext, id)) {
      for (const code of LANGUAGE_CODES) {
        results.push({
          label: code,
          required: false,
          type: 'string',
        });
      }
      this.cache.TypedPropertiesFromId[id] = results;
      return results;
    }

    const keys = this.getPropertiesFromId(dtContext, id);
    const type = this.getShortNameFromId(dtContext, id);
    const getRequiredProperties = type
      ? this.getRequiredPropertiesFromType(type)
      : [];
    for (const key of keys) {
      const id = this.getIdFromShortName(dtContext, key);
      if (!id) {
        continue;
      }
      const item = {
        label: key,
        required: getRequiredProperties.indexOf(key) !== -1,
        type: this.isArrayFromShortName(key)
          ? 'array'
          : this.getValueTypesFromId(dtContext, id)[0] || '',
      };
      results.push(item);
    }
    this.cache.TypedPropertiesFromId[id] = results;
    return results;
  }

  getTypedPropertiesFromType(
    dtContext: DigitalTwinMetaModelContext,
    type: string
  ) {
    const id = this.getIdFromType(dtContext, type);
    if (!id) {
      console.warn(`Cannot find ID for type ${type}.`);
      return [];
    }
    const results = this.getTypedPropertiesFromId(dtContext, id);
    console.log(id, results);
    return results;
  }

  getPropertiesFromId(dtContext: DigitalTwinMetaModelContext, id: string) {
    if (this.cache.PropertiesFromId[id]) {
      return this.cache.PropertiesFromId[id];
    }
    console.log(`Checking properties for ${id}...`);
    let properties: string[] = [];

    if (this.isInternationalizationFromId(dtContext, id)) {
      properties = LANGUAGE_CODES;
    } else {
      for (const edge of this.graph.Edges) {
        if (
          edge.TargetNode.Id === id &&
          edge.Label === DigitalTwinMetaModelParser.LABEL.DOMAIN
        ) {
          properties.push(
            this.getPropertyNameFromId(dtContext, edge.SourceNode.Id)
          );
        } else if (
          edge.SourceNode.Id === id &&
          edge.Label === DigitalTwinMetaModelParser.LABEL.SUBCLASS
        ) {
          console.log(`Found sub class of for ${id}: ${edge.TargetNode.Id}`);
          properties = properties.concat(
            this.getPropertiesFromId(dtContext, edge.TargetNode.Id)
          );
        }
      }
    }

    const keys = uniq(properties).sort();
    this.cache.PropertiesFromId[id] = keys;
    return keys;
  }

  getPropertiesFromType(dtContext: DigitalTwinMetaModelContext, type: string) {
    const id = this.getIdFromType(dtContext, type);
    if (!id) {
      console.warn(`Cannot find ID for type ${type}.`);
      return [];
    }
    const results = this.getPropertiesFromId(dtContext, id);
    console.log(results);
    return results;
  }

  getTypesFromId(dtContext: DigitalTwinMetaModelContext, id: string): string[] {
    if (this.cache.TypesFromId[id]) {
      return this.cache.TypesFromId[id];
    }
    let types: string[] = [];

    for (const edge of this.graph.Edges) {
      if (
        edge.SourceNode.Id === id &&
        edge.Label === DigitalTwinMetaModelParser.LABEL.RANGE
      ) {
        types = types.concat(
          this.getTypesFromId(dtContext, edge.TargetNode.Id)
        );
      }

      if (
        edge.TargetNode.Id === id &&
        edge.Label === DigitalTwinMetaModelParser.LABEL.SUBCLASS
      ) {
        types = types.concat(
          this.getTypesFromId(dtContext, edge.SourceNode.Id)
        );
      }
    }

    if (types.length === 0) {
      const label = this.getLabelFromId(dtContext, id);
      const shortName = this.getShortNameFromLabel(dtContext, label);
      if (shortName) {
        types.push(shortName);
      }
    }
    types = uniq(types).sort();

    this.cache.TypesFromId[id] = types;
    return types;
  }

  getLabelFromId(dtContext: DigitalTwinMetaModelContext, id: string) {
    let label = '';
    if (id.indexOf(dtContext['@context']['@vocab']) === 0) {
      label = id.substr(dtContext['@context']['@vocab'].length);
    }
    if (label) {
      return label;
    }
    console.warn(`Cannot find label for ${id}.`);
    return id;
    // for (const edge of this.graph.Edges) {
    //     if (edge.SourceNode.Id === id && edge.Label ===
    //     DigitalTwinMetaModelParser.LABEL.LABEL) {
    //         return edge.TargetNode.Value;
    //     }
    // }
    // console.warn(`Cannot find label for ${id}.`);
    // return id;
  }

  getShortNameFromLabel(dtContext: DigitalTwinMetaModelContext, label: string) {
    if (this.cache.ShortNameFromLabel[label] !== undefined) {
      return this.cache.ShortNameFromLabel[label];
    }
    const context = dtContext['@context'];
    let labelInInterface = '';
    for (const key of Object.keys(context)) {
      const item = context[key];
      if (typeof item === 'string') {
        labelInInterface = item;
      } else {
        labelInInterface = item['@id'];
      }

      if (labelInInterface === label) {
        this.cache.ShortNameFromLabel[label] = key;
        return key;
      }
    }

    console.log(`Cannot find short name for label ${label}.`);
    if (label.indexOf('/') === -1) {
      this.cache.ShortNameFromLabel[label] = label;
      return label;
    } else {
      this.cache.ShortNameFromLabel[label] = null;
      return null;
    }
  }

  isArrayFromShortName(shortName: string) {
    return (
      ['contents', 'schemas', 'fields', 'enumValues', 'implements'].indexOf(
        shortName
      ) > -1
    );
  }

  getStringValuesFromShortName(
    dtContext: DigitalTwinMetaModelContext,
    shortName: string
  ) {
    const id = this.getIdFromShortName(dtContext, shortName);
    if (id === 'http://azureiot.com/v1/classes/InterfaceInstance/schema') {
      return ['XMLSchema#string'];
    }
    if (!id) {
      console.warn(`Cannot find ID for short name ${shortName}.`);
      return [];
    }

    return this.getStringValuesFromId(dtContext, id);
  }

  getStringValuesFromId(dtContext: DigitalTwinMetaModelContext, id: string) {
    if (this.cache.StringValuesFromId[id]) {
      return this.cache.StringValuesFromId[id];
    }
    let values: string[] = [];
    let hasProperty = false;
    for (const edge of this.graph.Edges) {
      if (
        edge.TargetNode.Id === id &&
        edge.Label === DigitalTwinMetaModelParser.LABEL.DOMAIN
      ) {
        hasProperty = true;
      }
      if (
        edge.SourceNode.Id === id &&
        edge.Label === DigitalTwinMetaModelParser.LABEL.RANGE
      ) {
        console.log(`${id} has range of ${edge.TargetNode.Id}`);
        values = values.concat(
          this.getStringValuesFromId(dtContext, edge.TargetNode.Id)
        );
      }
      if (
        edge.TargetNode.Id === id &&
        edge.Label === DigitalTwinMetaModelParser.LABEL.SUBCLASS
      ) {
        console.log(`${edge.SourceNode.Id} is sub class of ${id}`);
        values = values.concat(
          this.getStringValuesFromId(dtContext, edge.SourceNode.Id)
        );
      }
      if (
        edge.TargetNode.Id === id &&
        edge.Label === DigitalTwinMetaModelParser.LABEL.TYPE
      ) {
        console.log(`${edge.SourceNode.Id} has type of ${id}`);
        values = values.concat(
          this.getStringValuesFromId(dtContext, edge.SourceNode.Id)
        );
      }
    }
    if (values.length === 0) {
      if (hasProperty) {
        // this is object, ignore it
        console.log(`${id} is an object, ignored`);
        this.cache.StringValuesFromId[id] = [];
        return [];
      }
      const shortName = this.getShortNameFromId(dtContext, id);
      if (shortName) {
        console.log(`${id} has string value of ${shortName}`);
        values.push(shortName);
      }
    }
    this.cache.StringValuesFromId[id] = values;
    return values;
  }

  getShortNameFromId(dtContext: DigitalTwinMetaModelContext, id: string) {
    for (const shortName of Object.keys(dtContext['@context'])) {
      if (/^@/.test(shortName)) {
        continue;
      }

      const shortNameValue = dtContext['@context'][shortName];
      let _id;
      if (typeof shortNameValue === 'string') {
        _id = dtContext['@context']['@vocab'] + shortNameValue;
      } else {
        _id = dtContext['@context']['@vocab'] + shortNameValue['@id'];
      }

      if (id === _id) {
        return shortName;
      }
    }

    if (id.startsWith('http://www.w3.org')) {
      // RDF schema
      return id.split('/').pop();
    }
    const ct = dtContext['@context']['@vocab'];
    if (id.startsWith(ct)) {
      // Abosolut path
      return id.substr(ct.length);
    } else {
      // Relative path
      return id;
    }
  }

  isInternationalizationFromId(
    dtContext: DigitalTwinMetaModelContext,
    id: string
  ) {
    for (const shortName of Object.keys(dtContext['@context'])) {
      if (/^@/.test(shortName)) {
        continue;
      }

      const shortNameValue = dtContext['@context'][shortName];
      let _id;
      if (typeof shortNameValue !== 'string') {
        _id = dtContext['@context']['@vocab'] + shortNameValue['@id'];
        if (id === _id) {
          if (shortNameValue['@container'] === '@language') {
            return true;
          }
          return false;
        }
      }
    }

    return false;
  }

  getValueTypesFromId(dtContext: DigitalTwinMetaModelContext, id: string) {
    if (!id) {
      return [];
    }
    if (this.cache.ValueTypesFromId[id]) {
      return this.cache.ValueTypesFromId[id];
    }
    const values = this.getStringValuesFromId(dtContext, id);
    const valueTypes: string[] = [];
    values.forEach(value => {
      switch (value) {
        case 'XMLSchema#boolean':
          valueTypes.push('boolean');
          break;
        case 'XMLSchema#int':
          valueTypes.push('int');
          break;
        case 'XMLSchema#long':
          valueTypes.push('long');
          break;
        case 'XMLSchema#float':
          valueTypes.push('float');
          break;
        case 'XMLSchema#double':
          valueTypes.push('double');
          break;
        case 'XMLSchema#string':
          valueTypes.push('string');
          break;
        default:
          console.log(`High level type: ${value}`);
          break;
      }
    });

    this.cache.ValueTypesFromId[id] = valueTypes;
    return valueTypes;
  }

  getStringValuePattern(key: string) {
    // urn:[namespace]:[name]:[version]
    const urnPattern = /^urn:([a-zA-Z0-9_]+:)+[a-zA-Z0-9_]+:\d+$/;
    switch (key) {
      case '@id':
        return urnPattern;
      case 'name':
        return /^[a-zA-Z0-9_]+$/;
      case 'schema':
        return urnPattern;
      // case 'implements':
      //   return /^(http|https):\/\/.+\.interface\/.json$/;
      default:
        return null;
    }
  }

  getStringValueLengthRange(key: string) {
    switch (key) {
      case '@id':
        return [0, 256];
      case 'schema':
        return [0, 256];
      default:
        return null;
    }
  }

  getRequiredPropertiesFromType(type: string) {
    // I know, I know, hard code is ugly...
    // It's just fine :)
    switch (type) {
      case 'Interface':
        return ['@id', '@type', '@context'];
      case 'Telemetry':
        return ['@type', 'name', 'schema'];
      case 'Property':
        return ['@type', 'name', 'schema'];
      case 'Command':
        return ['@type', 'name'];
      case 'Array':
        return ['@type', 'elementSchema'];
      case 'Enum':
        return ['@type', 'enumValues'];
      case 'EnumValue':
        return ['name'];
      case 'Map':
        return ['@type', 'mapKey', 'mapValue'];
      case 'MapKey':
        return ['name', 'schema'];
      case 'MapValue':
        return ['name', 'schema'];
      case 'Object':
        return ['@type', 'fields'];
      case 'SchemaField':
        return ['name', 'schema'];
      case 'Boolean':
      case 'Bytes':
      case 'Date':
      case 'DateTime':
      case 'Duration':
      case 'Float':
      case 'Integer':
      case 'Long':
      case 'String':
      case 'Time':
        return ['@type'];
      case 'CapabilityModel':
        return ['@id', '@type', '@context', 'implements'];
      case 'InterfaceInstance':
        return ['name', 'schema'];
      default:
        return [];
    }
  }
}
