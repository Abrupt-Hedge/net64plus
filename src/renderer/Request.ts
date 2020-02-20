import axios, { AxiosInstance, AxiosPromise } from 'axios'
import * as fs from 'fs'
import * as path from 'path'

import { Release } from '../models/Release.model'
import { Server } from '../models/Server.model'
import { getCurrentServerVersion, isVersionNewer, isReleaseValid } from './utils/helper.util'

interface UpdateCheck {
  foundUpdate: boolean
  newVersionUrl?: string
  patchNotes?: string
  version?: string
}

class Request {
  private readonly smmdb: AxiosInstance

  private readonly github: AxiosInstance

  private apiKey = ''

  constructor () {
    this.smmdb = axios.create({
      // baseURL: 'http://localhost:8080/api',
      baseURL: 'https://smmdb.net/api/',
      responseType: 'json'
    })
    const githubApiKey = false // process.env.NODE_ENV === 'development' // TODO re-enable dev mode
      ? JSON.parse(fs.readFileSync(path.join(__dirname, '../../../.credentials'), {
        encoding: 'utf8'
      })).github
      : undefined
    this.github = axios.create({
      baseURL: 'https://api.github.com/',
      responseType: 'json',
      auth: process.env.NODE_ENV === 'development'
        ? {
          username: 'Tarnadas',
          password: githubApiKey
        }
        : undefined
    })
  }

  /**
   * Add an API key to send authorized requests.
   *
   * @param {string} apiKey - API key to add
   */
  public addApiKey (apiKey: string): void {
    this.apiKey = apiKey
  }

  public async getNet64Servers (): Promise<Server[] | null> {
    try {
      return (await this.smmdb.request({
        method: 'get',
        url: '/getnet64servers',
        timeout: 10000
      })).data
    } catch (err) {
      console.error(err)
      return null
    }
  }

  public async updateCheck (): Promise<UpdateCheck> {
    const releases = await request.getGithubReleases()
    if (!releases) {
      console.warn('Update check failed. You might be offline')
      return {
        foundUpdate: false
      }
    }
    const version: string = process.env.VERSION ?? ''
    return this.getMostRecentRelease(version, releases)
  }

  private async getGithubReleases (): Promise<Release[] | null> {
    try {
      return (await this.github.request({
        method: 'get',
        url: '/repos/tarnadas/net64plus/releases',
        timeout: 10000
      })).data
    } catch (err) {
      console.error(err)
      return null
    }
  }

  public async serverUpdateCheck (): Promise<UpdateCheck> {
    const releases = await request.getGithubServerReleases()
    if (!releases || releases.length === 0) {
      console.warn('Update check failed. You might be offline')
      return {
        foundUpdate: false
      }
    }
    const version = getCurrentServerVersion()
    return this.getMostRecentRelease(version, releases)
  }

  private async getGithubServerReleases (): Promise<Release[] | null> {
    try {
      return (await this.github.request({
        method: 'get',
        url: '/repos/tarnadas/net64plus-server/releases',
        timeout: 10000
      })).data
    } catch (err) {
      console.error(err)
      return null
    }
  }

  private getMostRecentRelease (version: string | undefined, releases: Release[]): UpdateCheck {
    for (const release of releases) {
      if (!isReleaseValid(release)) continue
      if (!isVersionNewer(release.tag_name, version)) continue
      for (const asset of release.assets) {
        if (asset.name == null || !asset.name.includes('64plus') || !asset.name.includes(process.platform)) continue
        const newVersionUrl = asset.browser_download_url
        if (!newVersionUrl) continue
        return {
          foundUpdate: true,
          newVersionUrl,
          patchNotes: release.body,
          version: release.tag_name
        }
      }
    }
    return {
      foundUpdate: false
    }
  }

  public downloadServerVersion (
    url: string,
    onDownloadProgress: (progressEvent: any) => void
  ): AxiosPromise<ArrayBuffer> {
    return axios.get<ArrayBuffer>(url, {
      onDownloadProgress,
      responseType: 'arraybuffer'
    })
  }
}
export const request = new Request()
