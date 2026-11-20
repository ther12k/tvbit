import { defineAction, defineScreen } from "@tenunjs/core";
import { Button, Column, Scaffold, Text, TextField, Wrap } from "@tenunjs/widgets";
import type { LoadResult } from "../layout";

/**
 * TN-196 settings screen: playlist URL entry through the EXISTING
 * TextField/IME path (TN-160 controlled input; on the TV the remote's
 * text mode drives it), loading via the media host's bounded fetchText.
 * The load result arrives as a pushed "loadResult" (the runtime owns
 * the async journey), so navigating away mid-load never loses it.
 */
export interface SettingsState {
  url: string;
  loading: boolean;
  result: LoadResult | null;
}

export const SettingsScreen = defineScreen({
  name: "Settings",
  initialState: (): SettingsState => ({ url: "", loading: false, result: null }),
  actions: {
    url: defineAction<SettingsState, string>({
      run({ input, state }) {
        state.url = input;
      },
    }),
    loadResult: defineAction<SettingsState, LoadResult>({
      run({ input, state }) {
        state.loading = false;
        state.result = input;
      },
    }),
    load: defineAction<SettingsState, void>({
      run({ state, services }) {
        if (state.loading) return;
        const url = state.url.trim();
        if (url === "") {
          state.result = { ok: false, message: "enter a playlist URL first" };
          return;
        }
        state.loading = true;
        state.result = null;
        (services as { loadPlaylist?: (url: string) => void }).loadPlaylist?.(url);
      },
    }),
    back: defineAction<SettingsState, void>({
      run({ services }) {
        (services as { navigate?: (route: string) => void }).navigate?.("player");
      },
    }),
  },
  view({ state, actions }) {
    return (
      <Scaffold>
        <Column padding="lg" gap="lg">
          <Text variant="title" color="accent">
            Settings
          </Text>
          <Text variant="body" color="textDim">
            Load an M3U, M3U8, or JSON channel list from a URL. Use a source you’re authorized to access.
          </Text>
          <TextField
            id="playlist-url"
            label="Playlist URL"
            placeholder="https://example.com/playlist.m3u"
            value={state.url}
            onChanged={actions.url}
          />
          <Wrap spacing="md" runSpacing="sm">
            <Button variant={state.loading ? "text" : "primary"} onPress={state.loading ? undefined : actions.load}>
              Load playlist
            </Button>
            <Button variant="secondary" onPress={actions.back}>
              Back to player
            </Button>
          </Wrap>
          {state.loading ? (
            <Text variant="body" color="textDim">Loading playlist…</Text>
          ) : state.result && (
            <Text variant="body" color={state.result.ok ? "success" : "danger"}>
              {state.result.ok ? `Loaded: ${state.result.message}` : `Failed: ${state.result.message}`}
            </Text>
          )}
        </Column>
      </Scaffold>
    );
  },
});
