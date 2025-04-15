export interface MessageType {
  client_msg_id?: string
  type: string
  user: string
  text: string
  ts: string
  team?: string
  user_profile?: {
    avatar_hash: string
    image_72: string
    first_name: string
    real_name: string
    display_name: string
    team: string
    name: string
    is_restricted: boolean
    is_ultra_restricted: boolean
  }
  blocks?: {
    type: string
    block_id: string
    elements: {
      type: string
      elements?: {
        type: string
        text?: string
        url?: string
      }[]
    }[]
  }[]
  attachments?: any[]
  channelId?: string
  channelName?: string
  channelType?: "channel" | "dm"
}

export interface ChannelInfo {
  id: string
  name: string
  displayName: string
  type: "channel" | "dm"
}
