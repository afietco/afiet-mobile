import { describe, expect, it } from 'vitest'
import {
  createGroupInviteLink,
  groupInviteCopy,
  groupInviteDestination,
  normalizeInviteLabel,
} from './inviteContext'

describe('group invitation context', () => {
  it('includes normalized group and inviter names in shared links', () => {
    expect(
      createGroupInviteLink('ab-c12345', {
        groupName: '  Pazar  Sofrası ',
        inviterName: 'Berk Karataş',
      }),
    ).toBe(
      'https://afiet.co/katil/ABC12345?groupName=Pazar%20Sofras%C4%B1&inviterName=Berk%20Karata%C5%9F',
    )
  })

  it('removes control characters and limits untrusted display labels', () => {
    expect(normalizeInviteLabel('  Aile\n\t Sofrası  ')).toBe('Aile Sofrası')
    expect(normalizeInviteLabel('a'.repeat(80))).toHaveLength(60)
  })

  it('uses the inviter name when it is available', () => {
    expect(
      groupInviteCopy({
        code: 'ABC12345',
        groupName: 'Aile Sofrası',
        inviterName: 'Ayşe',
      }),
    ).toEqual({
      title: 'Ayşe seni sofrasına çağırdı',
      body: '“Aile Sofrası” grubuna katılmak için giriş yap veya hesabını oluştur.',
    })
  })

  it('keeps legacy links understandable without display context', () => {
    expect(
      groupInviteCopy({ code: 'ABC12345', groupName: null, inviterName: null }),
    ).toEqual({
      title: 'Bir yakınından sofra davetin var',
      body: 'Gruba katılmak için giriş yap veya hesabını oluştur.',
    })
  })

  it('preserves the first-time experience before authentication', () => {
    expect(groupInviteDestination('loading', false, false)).toBeNull()
    expect(groupInviteDestination('anon', false, false)).toBe('/intro')
    expect(groupInviteDestination('anon', true, false)).toBe('/first-meal')
    expect(groupInviteDestination('anon', true, true)).toBe('/login')
    expect(groupInviteDestination('authed', false, false)).toBe('/grubum')
  })
})
