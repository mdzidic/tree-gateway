'use strict';

import * as redis from 'ioredis';
import * as _ from 'lodash';
import { CacheEntry, CacheStore, StoreCallback } from './cache-store';

export interface Options {
    maxAge?: number;
    prefix?: string;
    client: redis.Redis;
}

export class RedisStore implements CacheStore<CacheEntry> {
    public options: Options;

    constructor(options: Options) {
        this.options = _.defaults(options, {
            maxAge: 60, // default expire is one minute
            prefix: 'ca:'
        });
    }

    public set(key: string, value: CacheEntry, maxAge?: number): void {
        const rdskey = this.options.prefix + key;
        const opt: Options = this.options;
        if (maxAge) {
            opt.maxAge = maxAge / 1000;
        }
        opt.client.set(rdskey, JSON.stringify(value), 'EX', opt.maxAge);
    }

    public get(key: string, callback: StoreCallback<CacheEntry>): void {
        const rdskey = this.options.prefix + key;
        this.options.client.get(rdskey).then((cachedValue: string) => {
            if (cachedValue) {
                callback(null, JSON.parse(cachedValue));
            } else {
                callback(null, null);
            }
        }).catch((err: any) => {
            callback(err, null);
        });
    }

    public del(key: string): void {
        const rdskey = this.options.prefix + key;
        this.options.client.del(rdskey);
    }
}
