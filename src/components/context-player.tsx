'use client';
import { LockKeyhole, LoaderCircle, Pause, Play } from 'lucide-react';
import { usePlayer } from './player-provider';
import type { PlayerBeat } from '@/src/types/player';
import type { BeatFile } from '@/src/types/beat-file';

type ContextVersion = BeatFile['versions'][number];
type Parent = { _id: string; title: string; slug?: string; coverArtUrl?: string; lane?: PlayerBeat['lane'] };

export function ContextPlayer({ parent, versions }: { parent: Parent; versions: ContextVersion[] }) {
  const player = usePlayer();
  const queue: PlayerBeat[] = versions.filter((item) => item.audioAvailable && !item.nsfw).map((item) => ({
    _id: `version:${parent._id}:${item._key}`, sourceType: 'version', parentBeatId: parent._id, versionKey: item._key,
    title: item.title, versionType: item.versionType, parentBeatTitle: parent.title, parentBeatSlug: parent.slug,
    slug: parent.slug, coverArtUrl: parent.coverArtUrl, lane: parent.lane
  }));
  return <div className="grid gap-3">{versions.map((version) => {
    const trackId = `version:${parent._id}:${version._key}`; const active = player.beat?._id === trackId;
    const eligible = version.audioAvailable && !version.nsfw; const queueIndex = queue.findIndex((item) => item._id === trackId);
    const playVersion = () => active ? void player.togglePlayback() : void player.playQueue(queue, { type: 'context', title: `Context: ${parent.title}` }, queueIndex, false);
    return <article key={version._key} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"><div className="flex min-w-0 items-start gap-4"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-white">{version.title}</p>{version.versionType ? <Badge>{version.versionType}</Badge> : <Badge>Context</Badge>}{version.nsfw ? <span className="text-[10px] uppercase tracking-wider text-ember">Locked</span> : null}</div>{version.createdAt ? <p className="mt-2 text-xs text-mist/45">{formatDate(version.createdAt)}</p> : null}{version.nsfw ? <p className="mt-3 text-sm leading-6 text-ember"><LockKeyhole className="mr-1 inline h-4 w-4" />{version.nsfwReason || 'NSFW Context audio is locked.'}</p> : version.note ? <p className="mt-3 text-sm leading-6 text-mist/65">{version.note}</p> : null}{!version.audioAvailable && !version.nsfw ? <p className="mt-3 text-xs uppercase tracking-wider text-mist/40">Audio unavailable</p> : null}</div>{eligible ? <button type="button" onClick={playVersion} disabled={active && player.isLoading} className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/10 bg-white/10 text-white disabled:cursor-not-allowed disabled:text-mist/25" aria-label={`${active && player.isPlaying ? 'Pause' : active ? 'Resume' : 'Play'} ${version.title}`}>{active && player.isLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : active && player.isPlaying ? <Pause className="h-4 w-4" fill="currentColor" /> : <Play className="h-4 w-4" fill="currentColor" />}</button> : version.nsfw ? <span aria-label="Context audio locked" className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-ember/20 bg-ember/10 text-ember"><LockKeyhole className="h-4 w-4" /></span> : null}</div></article>;
  })}</div>;
}
function Badge({ children }: { children: React.ReactNode }) { return <span className="rounded-full border border-white/10 px-2 py-1 text-[9px] uppercase tracking-wider text-cobalt">{children}</span>; }
function formatDate(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(date); }
