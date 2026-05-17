import { Realm, createRealmContext } from '@realm/react';

export class Entry extends Realm.Object<Entry> {
  _id!: Realm.BSON.UUID;
  timestamp!: Date;
  transcript!: string;
  audioPath?: string;
  imagePath?: string;
  mood?: string;
  dayMoment!: DayMoment[];

  static schema = {
    name: 'Entry',
    primaryKey: '_id',
    properties: {
      _id: 'uuid',
      timestamp: 'date',
      transcript: 'string',
      audioPath: 'string?',
      imagePath: 'string?',
      mood: 'string?',
      dayMoment: {
        type: 'linkingObjects',
        objectType: 'DayMoment',
        property: 'entries',
      },
    },
  };
}

export class DayMoment extends Realm.Object<DayMoment> {
  date!: string;
  summary?: string;
  entries!: Realm.List<Entry>;

  static schema = {
    name: 'DayMoment',
    primaryKey: 'date', // Format: YYYY-MM-DD
    properties: {
      date: 'string',
      summary: 'string?',
      entries: 'Entry[]',
    },
  };
}


export const { RealmProvider, useRealm, useQuery, useObject } = createRealmContext({
  schema: [Entry, DayMoment],
  schemaVersion: 1,
});
