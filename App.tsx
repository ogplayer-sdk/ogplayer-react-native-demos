/**
 * OGPlayer React Native — integration demos.
 * A faithful mirror of the native Android demo app: same screens, same
 * copy, same streams, dark surfaces throughout (native demo parity). Excluded from the RN wrapper v1 (and therefore from this app):
 * custom action icons, SDK overlay slots, FreeWheel, vertical feed.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SafeAreaProvider, initialWindowMetrics, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BackHandler,
  FlatList,
  Image,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  OGDownloads,
  OGVerticalFeedView,
  OGPlayerView,
  type OGDownload,
  type OGPlayerViewRef,
  type OGMediaItem,
  type OGUIConfig,
  type OGPlayerError,
  type AudioTrack,
  type TextTrack,
  type VideoQuality,
  type OverlayConfig,
} from 'ogplayer-react-native';

// ── Brand (launcher) / dark demo surfaces (screens) ─────────────────────
const Ink = {
  bg: '#0E0E10',
  surface: '#17181D',
  accent: '#F6C445',
  text: '#FFFFFF',
  dim: 'rgba(255,255,255,0.6)',
};
const Light = {
  bg: '#0E0E10',           // dark everywhere — matches the native demo apps
  text: '#FFFFFF',
  dim: 'rgba(255,255,255,0.62)',
  chip: '#F6C445',         // selected chip = accent (native parity)
  chipText: 'rgba(255,255,255,0.87)',
  chipTextActive: '#1A1A1A',
  divider: 'rgba(255,255,255,0.16)',
  logBg: '#0A0B0D',
  logText: '#7CE38B',
};

// ── Streams (identical to the native demos) ──────────────────────────────
const TOS = 'https://media.ogplayer.tv/tos/master.m3u8';
const TOS_POSTER = 'https://media.ogplayer.tv/posters/tos-mech.jpg';
const TOS_STORYBOARD = 'https://media.ogplayer.tv/tos/storyboard/storyboard.vtt';
const LIVE = 'https://demo.unified-streaming.com/k8s/live/stable/live.isml/.m3u8';
const MULTI_AUDIO = 'https://media.axprod.net/TestVectors/Cmaf/clear_1080p_h264/manifest.m3u8';
const MISSING_STREAM = 'https://media.ogplayer.tv/tos/does-not-exist.m3u8';
const SUBS = 'https://demo.ogplayer.tv/subs';

// DRM — the same assets as the native demos: Google's Widevine test asset
// (Android) and the Axinom multi-DRM vector all three platforms share.
const WV_OPEN_MPD = 'https://storage.googleapis.com/wvmedia/cenc/h264/tears/tears.mpd';
const WV_OPEN_LICENSE = 'https://proxy.uat.widevine.com/proxy?provider=widevine_test';
const AX_MPD = 'https://media.axprod.net/TestVectors/Cmaf/protected_1080p_h264_cbcs/manifest.mpd';
const AX_HLS = 'https://media.axprod.net/TestVectors/Cmaf/protected_1080p_h264_cbcs/manifest.m3u8';
const AX_WV_LICENSE = 'https://drm-widevine-licensing.axtest.net/AcquireLicense';
const AX_FP_CERT = 'https://vtb.axinom.com/FPScert/fairplay.cer';
const AX_FP_LICENSE = 'https://drm-fairplay-licensing.axtest.net/AcquireLicense';
const AXINOM_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJ2ZXJzaW9uIjogMSwKICAiY29tX2tleV9pZCI6ICI2OWU1NDA4OC1lOWUwLTQ1MzAtOGMxYS0xZWI2ZGNkMGQxNGUiLAogICJtZXNzYWdlIjogewogICAgInR5cGUiOiAiZW50aXRsZW1lbnRfbWVzc2FnZSIsCiAgICAidmVyc2lvbiI6IDIsCiAgICAibGljZW5zZSI6IHsKICAgICAgImFsbG93X3BlcnNpc3RlbmNlIjogdHJ1ZQogICAgfSwKICAgICJjb250ZW50X2tleXNfc291cmNlIjogewogICAgICAiaW5saW5lIjogWwogICAgICAgIHsKICAgICAgICAgICJpZCI6ICIzMDJmODBkZC00MTFlLTQ4ODYtYmNhNS1iYjFmODAxOGEwMjQiLAogICAgICAgICAgImVuY3J5cHRlZF9rZXkiOiAicm9LQWcwdDdKaTFpNDNmd3YremZ0UT09IiwKICAgICAgICAgICJ1c2FnZV9wb2xpY3kiOiAiUG9saWN5IEEiCiAgICAgICAgfQogICAgICBdCiAgICB9LAogICAgImNvbnRlbnRfa2V5X3VzYWdlX3BvbGljaWVzIjogWwogICAgICB7CiAgICAgICAgIm5hbWUiOiAiUG9saWN5IEEiLAogICAgICAgICJwbGF5cmVhZHkiOiB7CiAgICAgICAgICAibWluX2RldmljZV9zZWN1cml0eV9sZXZlbCI6IDE1MCwKICAgICAgICAgICJwbGF5X2VuYWJsZXJzIjogWwogICAgICAgICAgICAiNzg2NjI3RDgtQzJBNi00NEJFLThGODgtMDhBRTI1NUIwMUE3IgogICAgICAgICAgXQogICAgICAgIH0KICAgICAgfQogICAgXQogIH0KfQ._NfhLVY7S6k8TJDWPeMPhUawhympnrk6WAZHOVjER6M';

// Google's public IMA sample tags (VAST single ad + VMAP ad-rule scenarios).
const VMAP_BASE =
  'https://pubads.g.doubleclick.net/gampad/ads?iu=/21775744923/external/vmap_ad_samples' +
  '&sz=640x480&ciu_szs=300x250%2C728x90&gdfp_req=1&ad_rule=1&output=vmap' +
  '&unviewed_position_start=1&env=vp&impl=s&cmsid=496&vid=short_onecue&correlator=';
const AD_SCENARIOS: Array<[string, string]> = [
  [
    'Skippable preroll',
    'https://pubads.g.doubleclick.net/gampad/ads?iu=/21775744923/external/' +
      'single_preroll_skippable&sz=640x480&ciu_szs=300x250%2C728x90&gdfp_req=1' +
      '&output=vast&unviewed_position_start=1&env=vp&impl=s&correlator=',
  ],
  ['Pre + mid + post', `${VMAP_BASE}&cust_params=sample_ar%3Dpremidpost`],
  ['Mid-roll pod (3 ads)', `${VMAP_BASE}&cust_params=sample_ar%3Dpremidpostpod`],
  ['Long pod (5 ads)', `${VMAP_BASE}&cust_params=sample_ar%3Dpremidpostlongpod`],
  [
    'Broken tag (error)',
    'https://pubads.g.doubleclick.net/gampad/ads?iu=/21775744923/external/does_not_exist' +
      '&sz=640x480&gdfp_req=1&output=vast&env=vp&impl=s&correlator=',
  ],
];

// ── Small shared pieces ──────────────────────────────────────────────────

function useLog() {
  const [lines, setLines] = useState<string[]>([]);
  const add = useCallback((line: string) => {
    const t = new Date();
    const p = (n: number, w = 2) => String(n).padStart(w, '0');
    setLines((prev) => [
      ...prev.slice(-200),
      `${p(t.getHours())}:${p(t.getMinutes())}:${p(t.getSeconds())}.${p(t.getMilliseconds(), 3)}  ${line}`,
    ]);
  }, []);
  return { lines, add };
}

function EventLog({ lines }: { lines: string[] }) {
  const ref = useRef<FlatList>(null);
  return (
    <FlatList
      ref={ref}
      style={s.log}
      contentContainerStyle={s.logContent}
      data={lines}
      keyExtractor={(_, i) => String(i)}
      onContentSizeChange={() => ref.current?.scrollToEnd({ animated: false })}
      renderItem={({ item }) => <Text style={s.logLine}>{item}</Text>}
    />
  );
}

/** Native FilterChip look-alike on the dark surface. */
function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[s.chip, active && s.chipActive]}>
      <Text style={[s.chipText, active && s.chipTextActive]}>{active ? '✓ ' : ''}{label}</Text>
    </Pressable>
  );
}

/** Native-parity checkbox (RN core has none). */
function CheckBox({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <Pressable onPress={() => onChange(!checked)} hitSlop={6} style={s.checkbox}>
      {checked ? <Text style={s.checkboxMark}>✓</Text> : null}
    </Pressable>
  );
}

function SwitchRow({
  label, value, onChange, bold, disabled,
}: { label: string; value: boolean; onChange: (v: boolean) => void; bold?: boolean; disabled?: boolean }) {
  return (
    <View style={s.switchRow}>
      <Text style={[s.switchLabel, bold && { fontWeight: '700' }, disabled && { opacity: 0.4 }]}>
        {label}
      </Text>
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ true: Ink.accent, false: undefined }}
        thumbColor={value ? '#7A5F13' : undefined}
      />
    </View>
  );
}

/** Standard demo scaffold: 16:9 player on a dark surface, content below. */
function Screen({ player, children }: { player: React.ReactNode; children?: React.ReactNode }) {
  return (
    <View style={s.lightScreen}>
      <View style={s.playerBox}>{player}</View>
      {children}
    </View>
  );
}

function playerEvents(log: ReturnType<typeof useLog>) {
  return {
    onStateChanged: (st: string) => log.add(`onStateChanged: ${st}`),
    onPlay: () => log.add('onPlay'),
    onPause: () => log.add('onPause'),
    onResume: () => log.add('onResume'),
    onPlaybackCompleted: () => log.add('onPlaybackCompleted'),
    onSeekCompleted: (p: number) => log.add(`onSeekCompleted: ${Math.round(p / 1000)}s`),
    onLiveEdgeChanged: (a: boolean) => log.add(`onLiveEdgeChanged: ${a}`),
    onError: (e: OGPlayerError) => log.add(`onError: ${e.code} ${e.message}`),
    onAnalyticsEvent: (e: { type: string }) => log.add(`analytics: ${e.type}`),
    onAdEvent: (e: { type: string }) => log.add(`ad: ${e.type}`),
  };
}

// ── PLAYBACK · Orientation & fullscreen ──────────────────────────────────
function OrientationDemo() {
  const [fs, setFs] = useState(false);
  return (
    <Screen
      player={
        <OGPlayerView
          style={s.fill}
          source={{
            url: TOS,
            title: 'Orientation demo',
            posterUrl: TOS_POSTER,
            thumbnailTrackUrl: TOS_STORYBOARD,
          }}
          autoplay={false}
          autoFullscreenOnRotate
          onFullscreenChanged={setFs}
        />
      }
    >
      {!fs && (
        <Text style={s.body}>
          Embedded 16:9 player.{'\n\n'}
          Tap the fullscreen button: the page rotates into landscape
          fullscreen. Tap it again (icon changes to “collapse”) and the player
          returns here, back in portrait. Rotating the device physically does
          the same.
        </Text>
      )}
    </Screen>
  );
}

// ── PLAYBACK · Controls on/off ───────────────────────────────────────────
const ALL_CONTROLS: Array<[string, keyof OGUIConfig]> = [
  ['Seek buttons (±10s)', 'showSeekButtons'],
  ['Progress bar', 'showProgressBar'],
  ['Time labels', 'showTimeLabels'],
  ['Subtitle button', 'showSubtitleButton'],
  ['Audio-track button', 'showAudioTrackButton'],
  ['Quality button', 'showQualityButton'],
  ['Speed button', 'showSpeedButton'],
  ['Volume button', 'showVolumeButton'],
  ['Cast button', 'showCastButton'],
  ['Fullscreen button', 'showFullscreenButton'],
];

function ControlsDemo() {
  const [hideAll, setHideAll] = useState(false);
  const [live, setLive] = useState(false);
  const [toggles, setToggles] = useState<Record<string, boolean>>(
    Object.fromEntries(ALL_CONTROLS.map(([l]) => [l, true]))
  );
  const config: OGUIConfig = hideAll
    ? { hideAllControls: true }
    : Object.fromEntries(ALL_CONTROLS.map(([label, key]) => [key, toggles[label]]));
  return (
    <Screen
      player={
        <OGPlayerView
          style={s.fill}
          source={
            live
              ? { url: LIVE, title: 'Controls playground — live', streamType: 'LIVE_DVR', posterUrl: TOS_POSTER }
              : { url: TOS, title: 'Controls playground', posterUrl: TOS_POSTER }
          }
          autoplay={false}
          uiConfig={config}
          castEnabled
          autoFullscreenOnRotate
        />
      }
    >
      <ScrollView>
        <Text style={s.caption}>
          Flip a switch — the running player updates instantly (OGUiConfig is
          state; no reload). Play/pause and the LIVE chip are always visible
          by SDK design.
        </Text>
        <SwitchRow label="Live content (shows LIVE chip)" value={live} onChange={setLive} bold />
        <SwitchRow label="hideAllControls()" value={hideAll} onChange={setHideAll} bold />
        <View style={s.divider} />
        {ALL_CONTROLS.map(([label]) => (
          <SwitchRow
            key={label}
            label={label}
            value={!hideAll && toggles[label]}
            disabled={hideAll}
            onChange={(v) => setToggles((t) => ({ ...t, [label]: v }))}
          />
        ))}
      </ScrollView>
    </Screen>
  );
}

// ── PLAYBACK · Custom action icons ───────────────────────────────────────
const ACTION_ICONS = [
  'og_demo_action_share', 'og_demo_action_favorite', 'og_demo_action_info',
  'og_demo_action_star', 'og_demo_action_search', 'og_demo_action_chat',
  'og_demo_action_download', 'og_demo_action_clock',
];

function CustomActionsDemo() {
  const log = useLog();
  const events = playerEvents(log);
  const [enabled, setEnabled] = useState<number[]>([0, 1]);
  const [watermark, setWatermark] = useState(false);
  const [nicam, setNicam] = useState(false);
  const sorted = enabled.slice().sort((a, b) => a - b);
  const actions = sorted.map((i) => ({
    iconName: ACTION_ICONS[i],
    accessibilityLabel: `Icon ${i + 1}`,
  }));
  return (
    <Screen
      player={
        <View style={s.fill}>
          <OGPlayerView
            key={nicam ? 'nicam' : 'plain'}
            style={s.fill}
            source={{
              url: TOS,
              title: 'Custom action icons',
              posterUrl: TOS_POSTER,
              ...(nicam ? { contentRatings: [{ age: 'SIXTEEN', descriptors: ['FEAR'] }] } : {}),
            }}
            uiConfig={{ customActions: actions }}
            autoplay
            autoFullscreenOnRotate
            {...events}
            onCustomAction={(i) => log.add(`custom icon${(sorted[i] ?? i) + 1} tap callback`)}
          />
          {watermark && (
            <View pointerEvents="none" style={s.watermarkBadge}>
              <Text style={s.watermarkText}>WATERMARK</Text>
            </View>
          )}
        </View>
      }
    >
      <View style={{ paddingHorizontal: 8 }}>
        {[0, 4].map((base) => (
          <View key={base} style={s.checkIconRow}>
            {[0, 1, 2, 3].map((k) => {
              const index = base + k;
              return (
                <View key={index} style={s.checkIconPair}>
                  <CheckBox
                    checked={enabled.includes(index)}
                    onChange={(checked) =>
                      setEnabled((cur) =>
                        checked ? [...cur, index] : cur.filter((x) => x !== index)
                      )
                    }
                  />
                  <Image
                    source={{ uri: ACTION_ICONS[index] }}
                    style={s.checkIconGlyph}
                  />
                </View>
              );
            })}
          </View>
        ))}
        <View style={s.checkIconRow}>
          <CheckBox checked={watermark} onChange={setWatermark} />
          <Text style={s.checkLabel}>Watermark</Text>
          <CheckBox checked={nicam} onChange={setNicam} />
          <Text style={s.checkLabel}>NICAM (reloads)</Text>
        </View>
      </View>
      <Text style={s.caption}>
        White outline icons sit inline left of the cast position and hide
        with the controls; each tap fires the host callback (logged below).
        Watermark is a separate overlay layer below the control line; NICAM
        icons show at content start.
      </Text>
      <EventLog lines={log.lines} />
    </Screen>
  );
}

// ── PLAYBACK · Picture-in-picture ────────────────────────────────────────
function PipDemo() {
  const log = useLog();
  const events = playerEvents(log);
  const player = useRef<OGPlayerViewRef>(null);
  const [autoEnter, setAutoEnter] = useState(true);
  return (
    <Screen
      player={
        <OGPlayerView
          ref={player}
          style={s.fill}
          source={{ url: TOS, title: 'Picture-in-picture', posterUrl: TOS_POSTER }}
          autoplay
          pipEnabled
          autoEnterPipOnBackground={autoEnter}
          {...events}
          onPipChanged={(active) => log.add(`pipChanged: isActive=${active}`)}
        />
      }
    >
      <View style={[s.checkIconRow, { paddingHorizontal: 8, gap: 14 }]}>
        <CheckBox checked={autoEnter} onChange={setAutoEnter} />
        <Text style={s.checkLabel}>Auto-enter on leave</Text>
      </View>
      <Text style={s.caption}>
        No PiP button anywhere — the developer decides. Press Home while
        playing and PiP enters automatically. The chrome is stripped in
        the little window and every transition is logged below.
      </Text>
      <EventLog lines={log.lines} />
    </Screen>
  );
}

// ── PLAYBACK · Starts in fullscreen ──────────────────────────────────────
function StartFullscreenDemo({ onClose }: { onClose: () => void }) {
  return (
    <View style={[s.lightScreen, { backgroundColor: '#000' }]}>
      <OGPlayerView
        style={s.fill}
        source={{ url: TOS, title: 'Starts in fullscreen', posterUrl: TOS_POSTER }}
        autoplay={false}
        startInFullscreen
        autoFullscreenOnRotate
        onFullscreenChanged={(f) => {
          if (!f) onClose();
        }}
      />
    </View>
  );
}

// ── PLAYBACK · Custom error messages ─────────────────────────────────────
const RETRY_MODES = ['SDK Retry', 'Custom label', 'No retry button', 'Branded style'];
const RETRY_EXPLAINERS = [
  'This screen loads a missing stream URL, so it always fails — your text (any language) replaces the SDK\u2019s default error overlay via errorMessages.',
  'retryButtonLabel: "Probeer opnieuw" — the SDK\u2019s Retry button, your text, any language.',
  'showRetryButton: false — the overlay shows only your message; recovery is your app\u2019s call (onError still fires).',
  'The error overlay is themeable: serif message and a blue serif Retry button via errorText*/retryButton* config — all SDK-drawn, so it follows fullscreen and rotation.',
];

function ErrorMessagesDemo() {
  const [message, setMessage] = useState('');
  const [retryMode, setRetryMode] = useState(0);
  const [gen, setGen] = useState(0);

  const config: OGUIConfig = {
    showRetryButton: retryMode !== 2,
    ...(retryMode === 1 ? { retryButtonLabel: 'Probeer opnieuw' } : {}),
    ...(retryMode === 3
      ? {
          errorTextColor: '#FFFFFF',
          errorTextSize: 16,
          errorTextFontFamily: 'serif',
          retryButtonColor: '#3D6EF5',
          retryButtonTextColor: '#FFFFFF',
          retryButtonFontFamily: 'serif',
        }
      : {}),
    ...(message.trim() ? { errorMessages: { default: message } } : {}),
  };

  return (
    <Screen
      player={
        <OGPlayerView
          key={gen}
          style={s.fill}
          source={{ url: MISSING_STREAM, title: 'Custom error demo' }}
          uiConfig={config}
          autoplay
          autoFullscreenOnRotate
        />
      }
    >
      <View style={s.errorForm}>
        <View style={s.errorRow}>
          <TextInput
            style={[s.input, { flex: 1, marginHorizontal: 0 }]}
            placeholder="Your error message — {code} = error code"
            placeholderTextColor={Light.dim}
            value={message}
            onChangeText={setMessage}
          />
          <Pressable style={s.reloadButton} onPress={() => setGen((g) => g + 1)}>
            <Text style={s.reloadButtonText}>Reload</Text>
          </Pressable>
        </View>
        <View style={[s.chipRow, { paddingHorizontal: 0 }]}>
          {RETRY_MODES.map((label, i) => (
            <Chip
              key={label}
              label={label}
              active={retryMode === i}
              onPress={() => {
                setRetryMode(i);
                setGen((g) => g + 1); // reload — same feel as the native demos
              }}
            />
          ))}
        </View>
        <Text style={[s.caption, { paddingHorizontal: 0 }]}>{RETRY_EXPLAINERS[retryMode]}</Text>
      </View>
    </Screen>
  );
}

// ── STREAMING · Live & DVR ───────────────────────────────────────────────
function LiveDemo() {
  const log = useLog();
  const events = playerEvents(log);
  const ref = useRef<OGPlayerViewRef>(null);
  const [dvr, setDvr] = useState(false);
  return (
    <Screen
      player={
        <OGPlayerView
          ref={ref}
          style={s.fill}
          source={{
            url: LIVE,
            title: dvr ? 'Live DVR demo' : 'Live demo',
            streamType: dvr ? 'LIVE_DVR' : 'LIVE',
          }}
          autoplay
          autoFullscreenOnRotate
          {...events}
        />
      }
    >
      <View style={s.chipRow}>
        <Chip label="LIVE (locked to edge)" active={!dvr} onPress={() => setDvr(false)} />
        <Chip label="LIVE_DVR (seekable)" active={dvr} onPress={() => setDvr(true)} />
        <Chip label="To live edge" onPress={() => ref.current?.seekToLiveEdge()} />
      </View>
      <Text style={s.caption}>
        Scrub behind the DVR edge and watch onLiveEdgeChanged flip in the log;
        tap the LIVE chip in the player to jump back.
      </Text>
      <EventLog lines={log.lines} />
    </Screen>
  );
}

// ── STREAMING · DRM ──────────────────────────────────────────────────────
function DrmDemo() {
  const log = useLog();
  const events = playerEvents(log);
  const [tokenized, setTokenized] = useState(false);

  // Android: Google's open Widevine test asset (DASH). iOS cannot play DASH
  // (AVFoundation has no DASH support) — the open-stream chip is
  // Android-only, exactly like the native demos differ per platform.
  const openSource: OGMediaItem = {
    url: WV_OPEN_MPD,
    title: 'Tears — Widevine test asset',
    posterUrl: TOS_POSTER,
    drm: { widevine: { licenseUrl: WV_OPEN_LICENSE } },
  };
  const tokenSource: OGMediaItem = {
    url: Platform.OS === 'android' ? AX_MPD : AX_HLS,
    title: 'Multi-DRM demo (encrypted)',
    drm: {
      widevine: { licenseUrl: AX_WV_LICENSE },
      fairplay: { certificateUrl: AX_FP_CERT, licenseUrl: AX_FP_LICENSE },
      tokenHeaderName: 'X-AxDRM-Message',
      tokenProvider: async ({ renewal }) => {
        log.add(`tokenProvider called (renewal=${renewal})`);
        return { 'X-AxDRM-Message': AXINOM_TOKEN };
      },
    },
  };
  const iosOnlyToken = Platform.OS !== 'android';
  return (
    <Screen
      player={
        <OGPlayerView
          style={s.fill}
          source={tokenized || iosOnlyToken ? tokenSource : openSource}
          autoplay
          autoFullscreenOnRotate
          {...events}
        />
      }
    >
      <View style={s.chipRow}>
        {!iosOnlyToken && (
          <Chip label="Widevine (open)" active={!tokenized} onPress={() => setTokenized(false)} />
        )}
        <Chip
          label={Platform.OS === 'android' ? 'Token header' : 'FairPlay (token header)'}
          active={tokenized || iosOnlyToken}
          onPress={() => setTokenized(true)}
        />
      </View>
      <Text style={s.caption}>
        Watch for DrmKeysLoaded in the log; the token-header stream also logs
        each tokenProvider call.
      </Text>
      <EventLog lines={log.lines} />
    </Screen>
  );
}

// ── STREAMING · Offline downloads ────────────────────────────────────────
function DownloadsDemo() {
  const log = useLog();
  const events = playerEvents(log);
  const addLog = log.add;
  const [drm, setDrm] = useState(false);
  const [downloads, setDownloads] = useState<OGDownload[]>([]);
  const [playSource, setPlaySource] = useState<OGMediaItem | null>(null);
  const [gen, setGen] = useState(0);

  // The same streams the DRM demo uses; the Axinom entitlement message
  // carries allow_persistence, so its licence may be stored offline.
  const item = useCallback(
    (encrypted: boolean): OGMediaItem =>
      encrypted
        ? {
            url: AX_MPD,
            title: 'Multi-DRM (persistent licence)',
            drm: {
              widevine: { licenseUrl: AX_WV_LICENSE },
              tokenHeaderName: 'X-AxDRM-Message',
              tokenProvider: async ({ renewal }) => {
                addLog(`tokenProvider called (renewal=${renewal})`);
                return { 'X-AxDRM-Message': AXINOM_TOKEN };
              },
            },
          }
        : { url: TOS, title: 'Tears of Steel', posterUrl: TOS_POSTER },
    [addLog]
  );

  // A COMPLETED download auto-loads into the player (paused) exactly once —
  // the player's own play button is the demo's play control; Delete resets
  // the latch. Offline pickup is keyed by URL, no special code.
  const loadedUrlRef = useRef<string | null>(null);
  const maybeLoadCompleted = useCallback(
    (ds: OGDownload[]) => {
      const done = ds.find((d) => d.state === 'COMPLETED');
      if (!done) {
        if (ds.length === 0) {
          loadedUrlRef.current = null;
          setPlaySource(null);
        }
        return;
      }
      if (loadedUrlRef.current === done.url) return;
      loadedUrlRef.current = done.url;
      addLog('— downloaded, loading into the player (plays offline) —');
      setPlaySource(item(done.url === AX_MPD));
      setGen((g) => g + 1);
    },
    [addLog, item]
  );

  const refresh = useCallback(() => {
    OGDownloads.list()
      .then((ds) => {
        setDownloads(ds);
        maybeLoadCompleted(ds);
      })
      .catch(() => {});
  }, [maybeLoadCompleted]);

  useEffect(() => {
    refresh();
    const sub = OGDownloads.addListener((e) => {
      if (e.type === 'failed') {
        addLog(`download failed: ${e.error.code} ${e.error.message}`);
      } else {
        addLog(
          `download ${e.type}: ${e.download.state}` +
            (e.download.progressPercent >= 0 ? ` · ${Math.round(e.download.progressPercent)}%` : '')
        );
      }
      refresh();
    });
    return () => {
      sub.remove();
      // Demo hygiene: leaving the screen deletes the downloads (passing the
      // DRM item on the Widevine row so the licence release authenticates).
      // The SDK itself keeps downloads until told otherwise.
      OGDownloads.list()
        .then((ds) =>
          ds.forEach((d) => OGDownloads.remove(d.url, d.url === AX_MPD ? item(true) : undefined))
        )
        .catch(() => {});
    };
  }, [addLog, item, refresh]);

  const licLabel = (d: OGDownload) => {
    const l = d.license;
    if (!l) return '';
    if (l.isExpired) return ' · licence expired';
    if (l.expiresAtMs == null) return ' · licence: no expiry';
    return ` · licence ${Math.max(0, Math.round((l.remainingMs ?? 0) / 3600000))}h left`;
  };

  return (
    <Screen
      player={
        playSource ? (
          <OGPlayerView
            key={gen}
            style={s.fill}
            source={playSource}
            autoplay={false}
            autoFullscreenOnRotate
            {...events}
          />
        ) : (
          <View style={[s.fill, { alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={s.caption}>Download below — the finished download loads here.</Text>
          </View>
        )
      }
    >
      {/* One download at a time: while anything is downloaded or in flight,
          the stream chooser and Download chip give way to the download's own
          row — Delete brings the choices back. A COMPLETED download
          auto-loads into the player above, so its own play button is the
          only play control (the row keeps just Delete). */}
      {downloads.length === 0 && (
        <>
          <View style={s.chipRow}>
            <Chip label="Clear (ToS)" active={!drm} onPress={() => setDrm(false)} />
            <Chip label="Widevine" active={drm} onPress={() => setDrm(true)} />
          </View>
          <View style={s.chipRow}>
            <Chip
              label="Download"
              onPress={() => {
                addLog(`add: ${item(drm).title}`);
                OGDownloads.add(item(drm), { maxVideoHeight: 720 }).then(refresh);
              }}
            />
          </View>
        </>
      )}
      {downloads.map((d) => (
        <View key={d.url} style={s.dlRow}>
          <Text style={s.dlText} numberOfLines={2}>
            {d.title ?? d.url} · {d.state}
            {d.progressPercent >= 0 ? ` · ${Math.round(d.progressPercent)}%` : ''}
            {licLabel(d)}
          </Text>
          {(d.state === 'DOWNLOADING' || d.state === 'QUEUED') && (
            <Chip label="Pause" onPress={() => { OGDownloads.pause(d.url); refresh(); }} />
          )}
          {(d.state === 'PAUSED' || d.state === 'FAILED') && (
            <Chip label="Resume" onPress={() => { OGDownloads.resume(d.url); refresh(); }} />
          )}
          {d.state !== 'REMOVING' && (
            <Chip
              label="Delete"
              // Pass the item for the DRM row so the Widevine licence release
              // can authenticate (frees the server-side offline slot too).
              onPress={() => {
                OGDownloads.remove(d.url, d.url === item(true).url ? item(true) : undefined).then(refresh);
              }}
            />
          )}
        </View>
      ))}
      <Text style={s.caption}>
        Download a stream, toggle airplane mode, press play on the player —
        playback keeps going from local storage (same URL, automatic offline
        pickup). The Widevine stream restores its stored persistent licence
        without a token call.
      </Text>
      <EventLog lines={log.lines} />
    </Screen>
  );
}

// ── STREAMING · Chromecast / AirPlay ─────────────────────────────────────
function CastDemo() {
  const log = useLog();
  const events = playerEvents(log);
  const [sdkButton, setSdkButton] = useState(true);
  return (
    <Screen
      player={
        <OGPlayerView
          style={s.fill}
          source={{ url: TOS, title: 'Cast demo', posterUrl: TOS_POSTER }}
          autoplay={false}
          castEnabled
          uiConfig={{ showCastButton: sdkButton }}
          autoFullscreenOnRotate
          {...events}
        />
      }
    >
      <SwitchRow label="SDK cast button" value={sdkButton} onChange={setSdkButton} bold />
      <Text style={s.caption}>
        {Platform.OS === 'android'
          ? 'Tap the player: the cast button sits top-right in the controls and opens the device picker (a real cast device is needed for the handoff). Toggle the switch to hide the SDK\u2019s button — the connector keeps working, so an app can bring its own cast UI instead.'
          : 'Tap the player: the AirPlay button sits top-right in the controls and opens the route picker. Toggle the switch to hide the SDK\u2019s button — AirPlay keeps working via Control Center, so an app can bring its own UI instead.'}
      </Text>
      <EventLog lines={log.lines} />
    </Screen>
  );
}

// ── MONETISATION · Ads (IMA) ─────────────────────────────────────────────
function AdsDemo() {
  const log = useLog();
  const events = playerEvents(log);
  const [scenario, setScenario] = useState(0);
  return (
    <Screen
      player={
        <OGPlayerView
          key={scenario}
          style={s.fill}
          source={{
            url: TOS,
            title: `Ads — ${AD_SCENARIOS[scenario][0]}`,
            ads: { adTagUrl: AD_SCENARIOS[scenario][1] },
          }}
          adsEnabled
          autoplay
          autoFullscreenOnRotate
          {...events}
        />
      }
    >
      <ScrollView horizontal style={s.chipScroll} contentContainerStyle={s.chipRow}>
        {AD_SCENARIOS.map(([label], i) => (
          <Chip key={label} label={label} active={scenario === i} onPress={() => setScenario(i)} />
        ))}
      </ScrollView>
      <Text style={s.caption}>
        Google’s public IMA sample tags. The SDK draws its own ad chrome —
        pod position, countdown, cue markers; skip and “Learn more” come from
        IMA. The broken tag shows the ad-error path: content plays on.
      </Text>
      <EventLog lines={log.lines} />
    </Screen>
  );
}

// ── TRACKS · Subtitles & audio ───────────────────────────────────────────
const SUB_SOURCES = ['Embedded', 'Multi-audio', 'Sideloaded VTT', 'Positioned VTT'] as const;
const SIZE_PRESETS: Array<[string, number]> = [
  ['Small', 0.8], ['Default', 1.0], ['Large', 1.4], ['X-Large', 1.8],
];

function TracksDemo() {
  const log = useLog();
  const events = playerEvents(log);
  const ref = useRef<OGPlayerViewRef>(null);
  const [source, setSource] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [serif, setSerif] = useState(false);
  const [volMode, setVolMode] = useState<'DEVICE' | 'PLAYER'>('DEVICE');
  const [tracks, setTracks] = useState<{ textTracks: TextTrack[]; audioTracks: AudioTrack[]; videoQualities: VideoQuality[] }>({
    textTracks: [], audioTracks: [], videoQualities: [],
  });

  const items: OGMediaItem[] = [
    { url: TOS, title: 'Embedded subtitles', posterUrl: TOS_POSTER },
    { url: MULTI_AUDIO, title: 'Multi-audio (stereo · 5.1 · M&E)' },
    {
      url: TOS,
      title: 'Sideloaded VTT',
      posterUrl: TOS_POSTER,
      sideloadedSubtitles: [
        { url: `${SUBS}/tears_of_steel_en.vtt`, language: 'en', label: 'English', isDefault: true },
        { url: `${SUBS}/tears_of_steel_de.vtt`, language: 'de', label: 'Deutsch' },
        { url: `${SUBS}/tears_of_steel_fr.vtt`, language: 'fr', label: 'Français' },
        { url: `${SUBS}/tears_of_steel_es.vtt`, language: 'es', label: 'Español' },
        { url: `${SUBS}/tears_of_steel_ru.vtt`, language: 'ru', label: 'Русский' },
      ],
    },
    {
      url: TOS,
      title: 'Cue settings test',
      posterUrl: TOS_POSTER,
      sideloadedSubtitles: [
        { url: `${SUBS}/test_cue_settings.vtt`, language: 'en', label: 'Cue settings test', isDefault: true },
      ],
    },
  ];

  return (
    <Screen
      player={
        <OGPlayerView
          ref={ref}
          style={s.fill}
          source={items[source]}
          autoplay
          autoFullscreenOnRotate
          subtitleTextScale={scale}
          volumeControlMode={volMode}
          subtitleStyle={serif ? { fontFamily: 'serif' } : undefined}
          {...events}
          onTracksChanged={(t) => {
            setTracks(t);
            log.add(`tracks: ${t.audioTracks.length} audio · ${t.textTracks.length} text`);
          }}
        />
      }
    >
      <ScrollView style={{ flexGrow: 0 }}>
        <View style={{ flexDirection: 'row', paddingHorizontal: 12, gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={s.sectionLabel}>Subtitle source</Text>
            {SUB_SOURCES.map((label, i) => (
              <View key={label} style={{ marginBottom: 6 }}>
                <Chip label={label} active={source === i} onPress={() => setSource(i)} />
              </View>
            ))}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.sectionLabel}>Font size</Text>
            {SIZE_PRESETS.map(([label, v]) => (
              <View key={label} style={{ marginBottom: 6 }}>
                <Chip label={label} active={scale === v} onPress={() => setScale(v)} />
              </View>
            ))}
          </View>
        </View>
        <Text style={[s.sectionLabel, { paddingHorizontal: 12, marginTop: 8 }]}>Caption font:</Text>
        <View style={[s.chipRow, { paddingTop: 0 }]}>
          <Chip label="System (default)" active={!serif} onPress={() => setSerif(false)} />
          <Chip label="Serif (custom)" active={serif} onPress={() => setSerif(true)} />
        </View>
        <Text style={[s.sectionLabel, { paddingHorizontal: 12, marginTop: 8 }]}>Volume slider controls:</Text>
        <View style={{ paddingHorizontal: 12, gap: 6 }}>
          <Chip
            label="Device volume — hardware buttons move the slider"
            active={volMode === 'DEVICE'}
            onPress={() => setVolMode('DEVICE')}
          />
          <Chip
            label="Player only — hardware buttons ignored"
            active={volMode === 'PLAYER'}
            onPress={() => setVolMode('PLAYER')}
          />
        </View>
      </ScrollView>
      <EventLog lines={log.lines} />
    </Screen>
  );
}

// ── OVERLAYS · Content ratings ───────────────────────────────────────────
const AGES = ['ALL', 'SIX', 'NINE', 'TWELVE', 'FOURTEEN', 'SIXTEEN', 'EIGHTEEN'] as const;
const DESCRIPTORS = ['VIOLENCE', 'FEAR', 'SEX', 'DISCRIMINATION', 'DRUGS_ALCOHOL', 'COARSE_LANGUAGE'] as const;

function RatingsDemo() {
  const [age, setAge] = useState<(typeof AGES)[number]>('SIXTEEN');
  const [descs, setDescs] = useState<string[]>(['VIOLENCE', 'FEAR']);
  const [gen, setGen] = useState(0);
  return (
    <Screen
      player={
        <OGPlayerView
          key={gen}
          style={s.fill}
          source={{
            url: TOS,
            title: 'Content ratings demo',
            posterUrl: TOS_POSTER,
            contentRatings: [{ age, descriptors: descs }],
          }}
          autoplay
          autoFullscreenOnRotate
        />
      }
    >
      <ScrollView>
        <Text style={s.caption}>
          Kijkwijzer-style age + descriptor icons at program start — SDK
          preset artwork, fixed top-right. Change the rating and reload.
        </Text>
        <View style={s.chipRow}>
          {AGES.map((a) => (
            <Chip key={a} label={a} active={age === a} onPress={() => setAge(a)} />
          ))}
        </View>
        <View style={s.chipRow}>
          {DESCRIPTORS.map((d) => (
            <Chip
              key={d}
              label={d.toLowerCase().replace('_', '/')}
              active={descs.includes(d)}
              onPress={() =>
                setDescs((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d]))
              }
            />
          ))}
        </View>
        <View style={s.chipRow}>
          <Chip label="Reload with these ratings" onPress={() => setGen((g) => g + 1)} />
        </View>
      </ScrollView>
    </Screen>
  );
}

// ── Launcher ─────────────────────────────────────────────────────────────



// ── Watermarks ─────────────────────────────────────────────────────────
const SLOT_GRID: Array<Array<[string, string]>> = [
  [['TOP_START', 'Top-left'], ['TOP_CENTER', 'Top-center'], ['TOP_END', 'Top-right']],
  [['CENTER_START', 'Left'], ['CENTER', 'Center'], ['CENTER_END', 'Right']],
  [['BOTTOM_START', 'Bottom-left'], ['BOTTOM_CENTER', 'Bottom-center'], ['BOTTOM_END', 'Bottom-right']],
];

function WatermarksDemo() {
  const [enabled, setEnabled] = useState<Set<string>>(new Set(['TOP_END']));

  const overlays: OverlayConfig[] = useMemo(() => {
    let n = 0;
    const list: OverlayConfig[] = [];
    for (const row of SLOT_GRID) {
      for (const [slot] of row) {
        n += 1;
        if (enabled.has(slot)) {
          list.push({ slot: slot as OverlayConfig['slot'], text: `WATERMARK ${n}` });
        }
      }
    }
    return list;
  }, [enabled]);

  return (
    <Screen
      player={
        <OGPlayerView
          style={s.fill}
          source={{ url: TOS, title: 'Watermarks demo', posterUrl: TOS_POSTER }}
          overlays={overlays}
          autoplay
          autoFullscreenOnRotate
        />
      }
    >
      <Text style={s.caption}>
        Your overlays in nine anchored slots (uiConfig-free: the `overlays`
        prop). The SDK keeps them clear of the controls — top slots drop below
        the top bar, bottom slots lift above it — and hides them during ads.
      </Text>
      {SLOT_GRID.map((row, ri) => (
        <View key={ri} style={s.chipRow}>
          {row.map(([slot, label]) => (
            <Chip
              key={slot}
              label={label}
              active={enabled.has(slot)}
              onPress={() =>
                setEnabled((prev) => {
                  const next = new Set(prev);
                  next.has(slot) ? next.delete(slot) : next.add(slot);
                  return next;
                })
              }
            />
          ))}
        </View>
      ))}
    </Screen>
  );
}

// ── Vertical feed ──────────────────────────────────────────────────────
const FEED_BASE = 'https://media.ogplayer.tv/shorts/v3';
const FEED_CLIPS: Array<[string, string]> = [
  ['The memory scan', '@tearsofsteel \u00b7 Forty years on, they scan his memories of her \u2014 every one still intact. #scifi'],
  ['Forty years later', '@tearsofsteel \u00b7 Old Thom returns to the ruined church where it all began. #shortfilm'],
  ['Sponsored \u2014 OGPlayer', 'One player API \u2014 multi-DRM, ads, subtitles, casting. Free to evaluate at ogplayer.tv'],
  ['Rooftops of Amsterdam', '@tearsofsteel \u00b7 The projection sweeps across the old city\u2019s rooftops. #vfx'],
  ['Face to face', '@tearsofsteel \u00b7 Thom and the machine that remembers him, alone in the ruins. #robots'],
  ['The final projection', '@tearsofsteel \u00b7 He reaches out one last time \u2014 released CC-BY by the Blender Foundation. #ccby'],
];

const FEED_MODES: Array<[string, string, string]> = [
  ['VERTICAL VIEW', 'OG vertical view', 'The feed exactly as the SDK ships it: video, tap-to-pause, progress hairline. The right rail is an empty placeholder your app fills.'],
  ['VERTICAL VIEW', 'Custom: icons, title & badge', 'Titles + subtitles, and rail actions with live state \u2014 like, share, mute (drives the feed\u2019s real mute) and a \u22ef hook.'],
  ['SPLIT VIEW', 'Split screen: text + video', 'The page splits into a text section and a video section \u2014 text above or below (textPlacement), with band color and fonts. Swipe: item 2 has the text below.'],
  ['SPLIT VIEW', 'Split video: two sources', 'Two videos on one page \u2014 the primary plays on top with audio; the second starts in the same frame and pauses/resumes with it. Page 2 flips the audio to the bottom half.'],
  ['ERROR HANDLING', 'Errors: SDK default', 'Posters resolve, streams 404 \u2014 every page fails on purpose so the compact error surface shows. A failed page never blocks swiping.'],
];

function VerticalFeedDemo() {
  const [mode, setMode] = useState<number | null>(null);
  const [liked, setLiked] = useState<Set<number>>(new Set());
  const [muted, setMuted] = useState(false);
  const [events, setEvents] = useState(0);

  const rail = useCallback(
    (i: number, full: boolean) => {
      const likeCount = [1240, 87, 0, 356, 9, 2031][i] ?? 42;
      const base = [
        { iconName: 'ic_demo_heart', label: String(likeCount + (liked.has(i) ? 1 : 0)), isActive: liked.has(i), accessibilityLabel: 'Like' },
        { iconName: 'og_demo_action_share', label: '61', accessibilityLabel: 'Share' },
      ];
      return full
        ? [
            ...base,
            { iconName: muted ? 'ic_demo_volume_off' : 'ic_demo_volume_on', label: muted ? 'Unmute' : 'Mute', isActive: muted, accessibilityLabel: 'Mute' },
            { iconName: 'ic_demo_more', accessibilityLabel: 'More' },
          ]
        : base;
    },
    [liked, muted]
  );

  const items = useMemo(() => {
    if (mode === 2) {
      return [
        ['The old church', 'Amsterdam\u2019s canal belt, forty years on. The survivors kept the church exactly as it was on the night of the projection.', 'ABOVE_VIDEO'],
        ['Crossing the bridge', 'Thom walks the Oudezijds bridge one more time. The machines remember everything that happened here.', 'BELOW_VIDEO'],
        ['The machine waits', 'It has stood on the bridge for decades, silent and patient \u2014 and this text lives in the section above it.', 'ABOVE_VIDEO'],
      ].map(([title, subtitle, placement], i) => ({
        media: { url: `${FEED_BASE}/w169-0${i + 1}.mp4`, title },
        posterUrl: `${FEED_BASE}/w169-0${i + 1}.jpg`,
        title,
        subtitle,
        textPlacement: placement as 'ABOVE_VIDEO' | 'BELOW_VIDEO',
        contentFit: 'FILL' as const,
        railActions: rail(i, false),
      }));
    }
    if (mode === 3) {
      return [
        ['01', '04', 'Two sources, one page', 'PRIMARY'],
        ['02', '05', 'Audio from the bottom half', 'SECONDARY'],
      ].map(([a, b, title, audio], i) => ({
        media: { url: `${FEED_BASE}/clip${a}.mp4`, title },
        secondaryMedia: { url: `${FEED_BASE}/clip${b}.mp4` },
        splitAudioSource: audio as 'PRIMARY' | 'SECONDARY',
        posterUrl: `${FEED_BASE}/clip${a}.jpg`,
        title,
        railActions: rail(i, true),
      }));
    }
    if (mode === 4) {
      return [1, 2, 3].map((n) => ({
        media: { url: `${FEED_BASE}/broken-clip0${n}.mp4`, title: `Broken stream ${n}` },
        posterUrl: `${FEED_BASE}/clip0${n}.jpg`,
      }));
    }
    return FEED_CLIPS.map(([title, subtitle], i) => {
      const sponsored = i === 2;
      return {
        media: { url: sponsored ? `${FEED_BASE}/ad-ogplayer.mp4` : `${FEED_BASE}/clip0${i + 1}.mp4`, title },
        posterUrl: sponsored ? `${FEED_BASE}/ad-ogplayer.jpg` : `${FEED_BASE}/clip0${i + 1}.jpg`,
        sponsored,
        contentFit: sponsored ? ('FIT' as const) : ('FILL' as const),
        ...(mode === 1 ? { title, subtitle, railActions: sponsored ? [] : rail(i, true) } : {}),
      };
    });
  }, [mode, rail]);

  const config = useMemo(
    () => ({
      ...(mode === 1
        ? { showTitle: true, showSubtitle: true, textFontFamily: 'serif' }
        : { showTitle: mode === 2, showSubtitle: mode === 2 }),
      ...(mode === 2 ? { textBandFraction: 0.34, textBandColor: '#101216', textFontFamily: 'serif' } : {}),
    }),
    [mode]
  );

  const onRailAction = useCallback(
    (itemIndex: number, actionIndex: number) => {
      const full = mode === 1 || mode === 3;
      if (actionIndex === 0) {
        setLiked((prev) => {
          const next = new Set(prev);
          next.has(itemIndex) ? next.delete(itemIndex) : next.add(itemIndex);
          return next;
        });
      } else if (full && actionIndex === 2) {
        setMuted((m) => !m);
      }
    },
    [mode]
  );

  if (mode === null) {
    return (
      <ScrollView style={s.feedChooser} contentContainerStyle={s.feedChooserContent}>
        <Text style={s.feedChooserTitle}>Vertical feed</Text>
        <Text style={s.feedChooserSub}>One component, five ways to ship it. Pick a mode:</Text>
        {FEED_MODES.map(([group, title, desc], i) => (
          <View key={title}>
            {(i === 0 || FEED_MODES[i - 1][0] !== group) && (
              <Text style={s.feedGroupHeader}>{group}</Text>
            )}
            <Pressable style={s.feedModeCard} onPress={() => { setLiked(new Set()); setMuted(false); setEvents(0); setMode(i); }}>
              <Text style={s.feedModeTitle}>{title}</Text>
              <Text style={s.feedModeBody}>{desc}</Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>
    );
  }

  return (
    <View style={s.feedRoot}>
      <View style={s.feedHeader}>
        <Pressable onPress={() => setMode(null)} hitSlop={12}>
          <Text style={s.feedBack}>{'\u2039'} Modes</Text>
        </Pressable>
        <Text style={s.feedHeaderTitle}>Vertical feed</Text>
        <Text style={s.feedEvents}>Analytics ({events})</Text>
      </View>
      <OGVerticalFeedView
        key={mode}
        style={s.fill}
        items={items}
        config={config}
        muted={muted}
        onAnalyticsEvent={() => setEvents((n) => n + 1)}
        onRailAction={onRailAction}
        onItemDoubleTapped={() => {}}
      />
      <View style={s.feedFooter}>
        <Text style={s.feedFooterText}>{'OGPlayer demo \u2014 your tab bar goes here'}</Text>
      </View>
    </View>
  );
}

// ── Playlist & up next ─────────────────────────────────────────────────
const POSTROLL_ONLY =
  'https://pubads.g.doubleclick.net/gampad/ads?iu=/21775744923/external/vmap_ad_samples' +
  '&sz=640x480&ciu_szs=300x250%2C728x90&gdfp_req=1&ad_rule=1&output=vmap' +
  '&unviewed_position_start=1&env=vp&impl=s&cmsid=496&vid=short_onecue' +
  '&cust_params=sample_ar%3Dpostonly&correlator=';

const PLAYLIST_CLIPS: Array<[string, string, string | null]> = [
  ['w169-01', 'The old church', AD_SCENARIOS[0][1]],
  ['w169-02', 'Crossing the bridge', POSTROLL_ONLY],
  ['w169-03', 'The machine waits', null],
];

const PLAYLIST_MODES = ['Default', 'Lead 5s', 'Custom text', 'Branded style', 'Hidden', 'With ads'];
const PLAYLIST_EXPLAIN = [
  'Three 14-second clips auto-advance; the \u201cUp next\u201d card counts down during the last 10 seconds — tap it to skip immediately. Changing modes reloads the playlist.',
  'upNextLeadSeconds: 5 — the card appears 5 seconds before the end instead of the default 10.',
  'upNextText: \u201c{title} starts in {seconds}s\u2026\u201d — your copy, any language; {seconds} and {title} are substituted.',
  'upNextBackgroundColor / upNextTextColor / upNextFontFamily — brand the card: accent background, serif font, dark text.',
  'showUpNext: false — no card at all; the playlist still auto-advances silently.',
  'Ads are per item (ads.adTagUrl on each item): clip 1 opens with a skippable preroll, clip 2 ends with a postroll that plays before the queue advances, clip 3 is ad-free.',
];

function PlaylistDemo() {
  const log = useLog();
  const [mode, setMode] = useState(0);

  const playlist: OGMediaItem[] = PLAYLIST_CLIPS.map(([file, title, adTag]) => ({
    url: `https://media.ogplayer.tv/shorts/v3/${file}.mp4`,
    streamType: 'VOD',
    title,
    posterUrl: `https://media.ogplayer.tv/shorts/v3/${file}.jpg`,
    ...(mode === 5 && adTag ? { ads: { adTagUrl: adTag } } : {}),
  }));

  const config: OGUIConfig = {
    ...(mode === 1 ? { upNextLeadSeconds: 5 } : {}),
    ...(mode === 2 ? { upNextText: '{title} starts in {seconds}s\u2026' } : {}),
    ...(mode === 3
      ? {
          upNextText: 'Up next \u00b7 {title} \u00b7 {seconds}',
          upNextBackgroundColor: '#E6F6C445',
          upNextTextColor: '#131313',
          upNextTextSize: 13,
          upNextFontFamily: 'serif',
        }
      : {}),
    ...(mode === 4 ? { showUpNext: false } : {}),
  };

  return (
    <Screen
      player={
        <OGPlayerView
          key={mode}
          style={s.fill}
          playlist={playlist}
          uiConfig={config}
          autoplay
          adsEnabled={mode === 5}
          autoFullscreenOnRotate
          onPlaylistItemChanged={(i, title) => log.add(`onPlaylistItemChanged: #${i} \u00b7 ${title}`)}
          onPlaylistItemSkipped={(f, t) => log.add(`onPlaylistItemSkipped: #${f} \u2192 #${t}`)}
          onPlaybackCompleted={() => log.add('onPlaybackCompleted')}
          onError={(e) => log.add(`onError: ${e.code} ${e.message}`)}
          onAdEvent={(e) => log.add(`ad: ${e.type}`)}
        />
      }
    >
      <View style={s.chipRow}>
        {PLAYLIST_MODES.map((label, i) => (
          <Chip key={label} label={label} active={mode === i} onPress={() => { setMode(i); log.add(i === 5 ? '\u2014 loading playlist with per-item IMA tags \u2014' : '\u2014 loading playlist (3 clips, 14s each) \u2014'); }} />
        ))}
      </View>
      <Text style={s.caption}>{PLAYLIST_EXPLAIN[mode]}</Text>
      <EventLog lines={log.lines} />
    </Screen>
  );
}

type Demo = { title: string; desc: string; icon: string; Component: (p: { onClose: () => void }) => React.JSX.Element };
const GROUPS: Array<[string, Demo[]]> = [
  [
    'PLAYBACK',
    [
      { title: 'Orientation & fullscreen', icon: 'og_l_screen_rotation', desc: 'Rotation, embedded ⇄ fullscreen, insets and cutouts.', Component: () => <OrientationDemo /> },
      { title: 'Controls on/off', icon: 'og_l_tune', desc: 'Default chrome, per-control hide, fully headless.', Component: () => <ControlsDemo /> },
      { title: 'Custom action icons', icon: 'og_l_add_circle_outline', desc: 'Up to 8 host icons inline in the controls, with callbacks.', Component: () => <CustomActionsDemo /> },
      { title: 'Picture-in-picture', icon: 'og_l_pip', desc: 'Auto-enter on Home, dismiss pauses.', Component: () => <PipDemo /> },
      { title: 'Starts in fullscreen', icon: 'og_l_open_in_full', desc: 'Opens directly in fullscreen; host-intercepted exit.', Component: ({ onClose }) => <StartFullscreenDemo onClose={onClose} /> },
      { title: 'Playlist & up next', icon: 'og_l_playlist_play', desc: 'Queue clips that auto-advance, with a themeable countdown card.', Component: () => <PlaylistDemo /> },
      { title: 'Vertical feed', icon: 'og_l_swipe_vertical', desc: 'Swipeable portrait feed: preloaded neighbours, split layouts, sponsored items.', Component: () => <VerticalFeedDemo /> },
      { title: 'Custom error messages', icon: 'og_l_error_outline', desc: 'Your copy, your language, on our stable error codes.', Component: () => <ErrorMessagesDemo /> },
    ],
  ],
  [
    'STREAMING',
    [
      { title: 'Live & DVR', icon: 'og_l_sensors', desc: 'Live edge, seekable window, behind-edge state.', Component: () => <LiveDemo /> },
      { title: 'DRM', icon: 'og_l_lock', desc: Platform.OS === 'android' ? 'Widevine licence acquisition and silent recovery.' : 'FairPlay key exchange (device only).', Component: () => <DrmDemo /> },
      { title: 'Offline downloads', icon: 'og_demo_action_download', desc: 'Download, go offline, keep playing — persistent DRM licences included.', Component: () => <DownloadsDemo /> },
    ],
  ],
  ['TRACKS & DEVICES', [
    { title: 'Subtitles & audio', icon: 'og_l_closed_caption', desc: 'Embedded + sideloaded tracks, multi-audio, caption size & font.', Component: () => <TracksDemo /> },
    { title: Platform.OS === 'android' ? 'Chromecast' : 'AirPlay', icon: 'og_l_cast', desc: 'Hand playback off to the TV from the player chrome.', Component: () => <CastDemo /> },
  ]],
  ['MONETISATION', [{ title: 'Ads', icon: 'og_l_movie', desc: 'Pre/mid/post-roll pods, skip, cue markers (IMA).', Component: () => <AdsDemo /> }]],
  ['OVERLAYS', [
    { title: 'Watermarks', icon: 'og_l_branding_watermark', desc: 'Your overlays in nine anchored, controls-aware slots.', Component: () => <WatermarksDemo /> },
    { title: 'Content ratings', icon: 'og_l_shield', desc: 'Age + descriptor icons at program start.', Component: () => <RatingsDemo /> },
  ]],
];

export default function App() {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <AppBody />
    </SafeAreaProvider>
  );
}

function AppBody() {
  const insets = useSafeAreaInsets();
  const [screen, setScreen] = useState<null | { title: string; Component: Demo['Component'] }>(null);
  const close = useCallback(() => setScreen(null), []);

  // Android BACK: a demo screen closes back to the launcher (the guarded
  // native teardown handles leaving mid-fullscreen); the launcher exits.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (screen) {
        close();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [screen, close]);

  return (
    <View
      style={[
        s.root,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
        screen && { backgroundColor: Light.bg },
      ]}
    >
      <StatusBar barStyle="light-content" />
      {screen ? (
        <View style={s.lightRoot}>
          <View style={s.abar}>
            <Pressable onPress={close} hitSlop={12}>
              <Text style={s.back}>‹ Demos</Text>
            </Pressable>
            <Text style={s.abarTitle}>{screen.title}</Text>
            <View style={{ width: 64 }} />
          </View>
          <screen.Component onClose={close} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.launcher}>
          <View style={s.headerRow}>
            <Text style={s.brand}>
              <Text style={{ color: Ink.accent }}>OG</Text>Player
            </Text>
            <Text style={s.version}>React Native 1.1.2 · SDK 1.1.0/1.1.1</Text>
          </View>
          <Text style={s.h1}>Integration demos</Text>
          <Text style={s.lede}>Every SDK capability, demonstrated end to end.</Text>
          {GROUPS.map(([group, rows]) => (
            <View key={group}>
              <Text style={s.group}>{group}</Text>
              {rows.map((demo) => (
                <Pressable key={demo.title} style={s.row} onPress={() => setScreen(demo)}>
                  <View style={s.rowIcon}>
                    <Image
                      source={{ uri: demo.icon }}
                      style={s.rowIconImage}
                      resizeMode="contain"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.rowTitle}>{demo.title}</Text>
                    <Text style={s.rowDesc}>{demo.desc}</Text>
                  </View>
                  <Text style={s.chevron}>›</Text>
                </Pressable>
              ))}
            </View>
          ))}
          <Text style={s.footer}>
            Not yet in the React Native wrapper: FreeWheel.{'\n\n'}
            Content: Tears of Steel — (CC) Blender Foundation · OGPlayer is a
            product of Inverse DOO
          </Text>
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Ink.bg },
  // launcher (dark, brand)
  launcher: { padding: 16, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brand: { color: Ink.text, fontSize: 20, fontWeight: '700' },
  version: { color: Ink.dim, fontSize: 11, backgroundColor: Ink.surface, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, overflow: 'hidden' },
  h1: { color: Ink.text, fontSize: 30, fontWeight: '800', marginTop: 18 },
  lede: { color: Ink.dim, fontSize: 14, marginTop: 6, marginBottom: 6 },
  group: { color: Ink.dim, fontSize: 11, fontWeight: '700', letterSpacing: 1.2, marginTop: 18, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: Ink.surface, borderRadius: 10, padding: 14, marginBottom: 8 },
  sectionLabel: { color: '#1A1A1A', fontSize: 13.5, marginBottom: 4 },
  rowIcon: { width: 44, height: 44, borderRadius: 9, backgroundColor: 'rgba(246,196,69,0.12)', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  rowIconImage: { width: 22, height: 22, tintColor: '#F6C445' },
  rowTitle: { color: Ink.text, fontSize: 15, fontWeight: '600' },
  rowDesc: { color: Ink.dim, fontSize: 12.5, marginTop: 3, lineHeight: 17 },
  chevron: { color: Ink.dim, fontSize: 22, marginLeft: 8 },
  footer: { color: Ink.dim, fontSize: 11, textAlign: 'center', marginTop: 24, lineHeight: 16 },

  // demo screens (light, native-style)
  lightRoot: { flex: 1, backgroundColor: Light.bg },
  lightScreen: { flex: 1, backgroundColor: Light.bg },
  abar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 48, paddingHorizontal: 14, backgroundColor: Light.bg },
  back: { color: Ink.accent, fontSize: 15, fontWeight: '600', width: 64 },
  abarTitle: { color: Light.text, fontSize: 15, fontWeight: '700' },
  playerBox: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000' },
  fill: { flex: 1 },
  body: { color: Light.text, fontSize: 14, lineHeight: 20, padding: 16 },
  caption: { color: Light.dim, fontSize: 12.5, lineHeight: 18, paddingHorizontal: 16, paddingVertical: 8 },
  divider: { height: 1, backgroundColor: Light.divider, marginVertical: 4, marginHorizontal: 16 },
  switchRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 2 },
  switchLabel: { flex: 1, color: Light.text, fontSize: 14 },
  chipScroll: { flexGrow: 0 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 12, paddingVertical: 6 },
  chip: { backgroundColor: 'transparent', borderWidth: 1, borderColor: Light.divider, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  chipActive: { backgroundColor: Light.chip, borderColor: Light.chip },
  chipText: { color: Light.chipText, fontSize: 13 },
  feedChooser: { flex: 1, backgroundColor: '#0E0E10' },
  feedChooserContent: { padding: 20, paddingBottom: 40 },
  feedChooserTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '700' },
  feedChooserSub: { color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 6 },
  feedGroupHeader: { color: 'rgba(246,196,69,0.8)', fontSize: 11, fontWeight: '600', marginTop: 18, marginBottom: 4, letterSpacing: 1 },
  feedModeCard: { backgroundColor: '#17181C', borderRadius: 14, padding: 18, marginTop: 10 },
  feedModeTitle: { color: '#F6C445', fontSize: 16, fontWeight: '600' },
  feedModeBody: { color: 'rgba(255,255,255,0.72)', fontSize: 13, lineHeight: 18, marginTop: 6 },
  feedRoot: { flex: 1, backgroundColor: '#0E0E10' },
  feedHeader: { height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, backgroundColor: '#0E0E10' },
  feedBack: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  feedHeaderTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  feedEvents: { color: '#F6C445', fontSize: 13 },
  feedFooter: { height: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0E0E10' },
  feedFooterText: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  chipTextActive: { color: Light.chipTextActive, fontWeight: '600' },
  input: { borderWidth: 1, borderColor: Light.divider, borderRadius: 8, marginHorizontal: 12, paddingHorizontal: 12, paddingVertical: 8, color: Light.text, fontSize: 14 },
  log: { flex: 1, backgroundColor: Light.logBg, marginTop: 8, marginBottom: 10, minHeight: 90 },
  logContent: { paddingHorizontal: 16, paddingVertical: 10 },
  logLine: { color: Light.logText, fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },

  checkbox: { width: 20, height: 20, borderWidth: 2, borderColor: Ink.accent, borderRadius: 3, marginLeft: 10, marginRight: 6, alignItems: 'center', justifyContent: 'center' },
  checkboxMark: { color: Ink.accent, fontSize: 14, fontWeight: '700', lineHeight: 16 },
  checkIconRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5 },
  checkIconPair: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  checkIconGlyph: { width: 26, height: 26, tintColor: Light.text },
  checkLabel: { color: Light.text, fontSize: 13, marginRight: 8 },
  watermarkBadge: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 8, paddingVertical: 4 },
  watermarkText: { color: '#FFF', fontSize: 12 },
  // RN 0.87 types dropped StyleSheet.absoluteFillObject — spell it out.
  hostErrorDim: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(18,19,23,0.9)', alignItems: 'center', justifyContent: 'center' },
  hostErrorCard: { backgroundColor: '#1D1F24', borderRadius: 14, paddingHorizontal: 20, paddingVertical: 12, alignItems: 'center', margin: 12 },
  hostErrorTitle: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  hostErrorBody: { color: 'rgba(255,255,255,0.7)', fontSize: 11.5, marginTop: 3, textAlign: 'center' },
  hostErrorButton: { backgroundColor: Ink.accent, borderRadius: 6, paddingHorizontal: 18, paddingVertical: 7, marginTop: 8 },
  hostErrorButtonText: { color: '#131313', fontWeight: '600', fontSize: 13 },
  dlRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 4 },
  dlText: { flex: 1, color: Light.text, fontSize: 12.5, lineHeight: 17 },
  errorForm: { paddingHorizontal: 12, paddingVertical: 8 },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reloadButton: { backgroundColor: Ink.accent, borderRadius: 6, paddingHorizontal: 16, paddingVertical: 11 },
  reloadButtonText: { color: '#1A1A1A', fontWeight: '600', fontSize: 14 },
});
