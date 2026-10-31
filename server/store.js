import { MongoClient } from 'mongodb';
import { randomUUID } from 'node:crypto';

export async function createStore(uri, name='nova_pagoda') {
  let client, db;
  const memory=new Map(), paintings=new Map();
  if(uri) {
    client=new MongoClient(uri,{serverSelectionTimeoutMS:15000,maxPoolSize:8});
    await client.connect(); db=client.db(name);
    await db.collection('profiles').createIndex({keyHash:1},{unique:true});
    await db.collection('paintings').createIndex({slot:1},{unique:true});
  }
  const profiles=db?.collection('profiles');
  return {
    durable:!!db,
    async profileByKey(keyHash,changes) {
      const initial={_id:randomUUID(),coins:100,inventory:{},friends:[],incoming:[],createdAt:new Date()};
      if(profiles) return profiles.findOneAndUpdate({keyHash},{$set:changes,$setOnInsert:initial},{upsert:true,returnDocument:'after'});
      let p=[...memory.values()].find(p=>p.keyHash===keyHash);
      if(!p) { p={...initial,keyHash};memory.set(p._id,p); }
      Object.assign(p,changes);return p;
    },
    async get(id) {return profiles ? profiles.findOne({_id:id}) : memory.get(id);},
    async request(from,to) {
      if(profiles)await profiles.updateOne({_id:to},{$addToSet:{incoming:from}});
      else {const p=memory.get(to);if(p&&!p.incoming.includes(from))p.incoming.push(from);}
    },
    async accept(id,other) {
      const p=await this.get(id);if(!p?.incoming.includes(other))return false;
      if(profiles) {
        await profiles.updateOne({_id:id},{$addToSet:{friends:other},$pull:{incoming:other}});
        await profiles.updateOne({_id:other},{$addToSet:{friends:id},$pull:{incoming:id}});
      } else {
        p.incoming=p.incoming.filter(x=>x!==other);if(!p.friends.includes(other))p.friends.push(other);
        const q=memory.get(other);if(q&&!q.friends.includes(id))q.friends.push(id);
      }
      return true;
    },
    async buy(id,product) {
      if(profiles)return profiles.findOneAndUpdate({_id:id,coins:{$gte:product.price}},{$inc:{coins:-product.price,[`inventory.${product.id}`]:1}},{returnDocument:'after'});
      const p=memory.get(id);if(!p||p.coins<product.price)return null;
      p.coins-=product.price;p.inventory[product.id]=(p.inventory[product.id]||0)+1;return p;
    },
    async savePainting(slot,data) {
      if(db)await db.collection('paintings').updateOne({slot},{$set:{...data,slot,updatedAt:new Date()}},{upsert:true});
      else paintings.set(slot,{...data,slot});
    },
    async getPainting(slot) {return db ? db.collection('paintings').findOne({slot}) : paintings.get(slot);},
    async close() {await client?.close();}
  };
}
export function ownProfile(p) {
  return {id:p._id,name:p.name,role:p.role,outfit:p.outfit,coins:p.coins,inventory:p.inventory,friends:p.friends,incoming:p.incoming};
}
