'use strict'

import * as jwt from 'jsonwebtoken'
import * as redis from './redis'
import { randomString, sha1 } from '../lib/util'

const config = require('../../config')

/** 使用 id 或 WechatSessionRaw 获取 session */
export function get (data: WechatSessionRaw | string): Promise<WechatSession | null> {
  if (typeof data === 'string') {
    return redis.get(data)
  } else {
    return redis.get(data.openid + data.session_key)
  }
}

/** 新建一个 session */
export async function generate (wechatSession: WechatSessionRaw) {
  const serverSessionKey = wechatSession.openid + wechatSession.session_key
  const serverSession: WechatSession = {
    id: '',
    openid: wechatSession.openid,
    sessionKey: wechatSession.session_key,
    salt: randomString(6),
    token: ''
  }

  serverSession.id = sha1(serverSessionKey + serverSession.salt)
  serverSession.token = jwt.sign({ sub: serverSession.id } as any, config.secret, { expiresIn: wechatSession.expires_in })

  await redis.set(serverSessionKey, serverSession, 'EX', wechatSession.expires_in)
  console.log('good1')
  await redis.set(serverSession.id, serverSession, 'EX', wechatSession.expires_in)
  console.log('good2')

  return serverSession
}
