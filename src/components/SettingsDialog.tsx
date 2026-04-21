import * as React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import {
  GearIcon,
  XIcon,
  SunIcon,
  MoonIcon,
  DesktopIcon,
  EyeIcon
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

type ThemeMode = 'light' | 'dark' | 'system';
type ContrastMode = 'off' | 'on' | 'system';

interface Settings {
  theme: ThemeMode;
  highContrast: ContrastMode;
}

const DEFAULTS: Settings = { theme: 'system', highContrast: 'system' };
const STORAGE_KEY = 'ct_settings';

function readSettings(): Settings {
  if (typeof window === 'undefined') return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Settings & { highContrast: boolean | ContrastMode }>) };
    if (typeof parsed.highContrast === 'boolean') {
      parsed.highContrast = parsed.highContrast ? 'on' : 'off';
    }
    return parsed as Settings;
  } catch {
    return DEFAULTS;
  }
}

function applyToDocument(s: Settings) {
  const html = document.documentElement;
  const dark =
    s.theme === 'dark' ||
    (s.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const hc =
    s.highContrast === 'on' ||
    (s.highContrast === 'system' && window.matchMedia('(prefers-contrast: more)').matches);
  html.classList.toggle('dark', dark);
  html.classList.toggle('high-contrast', hc);
}

const THEMES: { value: ThemeMode; Icon: typeof SunIcon; label: string }[] = [
  { value: 'light',  Icon: SunIcon,     label: 'Light'  },
  { value: 'dark',   Icon: MoonIcon,    label: 'Dark'   },
  { value: 'system', Icon: DesktopIcon, label: 'System' }
];

const CONTRASTS: { value: ContrastMode; label: string }[] = [
  { value: 'off',    label: 'Off'    },
  { value: 'on',     label: 'On'     },
  { value: 'system', label: 'System' }
];

export function SettingsDialog() {
  const [settings, setSettings] = React.useState<Settings>(DEFAULTS);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setSettings(readSettings());
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!mounted) return;
    applyToDocument(settings);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch { /* noop */ }
  }, [settings, mounted]);

  React.useEffect(() => {
    if (!mounted || settings.theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      document.documentElement.classList.toggle('dark', e.matches);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [settings.theme, mounted]);

  React.useEffect(() => {
    if (!mounted || settings.highContrast !== 'system') return;
    const mq = window.matchMedia('(prefers-contrast: more)');
    const handler = (e: MediaQueryListEvent) => {
      document.documentElement.classList.toggle('high-contrast', e.matches);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [settings.highContrast, mounted]);

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button
          type="button"
          aria-label="User preferences"
          title="User preferences"
          className="inline-flex h-9 w-9 items-center justify-center border border-input bg-background text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <GearIcon size={16} aria-hidden="true" />
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 border border-border bg-card text-card-foreground shadow-lg data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <Dialog.Title className="text-sm font-semibold">User Preferences</Dialog.Title>
            <VisuallyHidden asChild>
              <Dialog.Description>
                Choose a theme and configure high-contrast mode. Preferences are saved in your browser only.
              </Dialog.Description>
            </VisuallyHidden>
            <Dialog.Close
              aria-label="Close preferences"
              className="inline-flex h-7 w-7 items-center justify-center text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <XIcon size={14} aria-hidden="true" />
            </Dialog.Close>
          </div>

          <div className="flex flex-col gap-5 p-4">
            <section>
              <p className="text-xs font-semibold">Theme</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Pick a palette or follow your system preference.
              </p>
              <div
                role="radiogroup"
                aria-label="Theme"
                className="mt-3 flex gap-1"
              >
                {THEMES.map(({ value, Icon, label }) => {
                  const active = mounted && settings.theme === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setSettings((s) => ({ ...s, theme: value }))}
                      className={cn(
                        'inline-flex h-9 flex-1 items-center justify-center gap-1.5 border text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                        active
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-input bg-background hover:bg-accent hover:text-accent-foreground'
                      )}
                    >
                      <Icon size={14} weight={active ? 'fill' : 'regular'} aria-hidden="true" />
                      {label}
                    </button>
                  );
                })}
              </div>
            </section>

            <div className="h-px bg-border" />

            <section>
              <div className="flex items-start gap-2">
                <EyeIcon size={16} className="mt-0.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                <div>
                  <p className="text-xs font-semibold">High Contrast</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    Sharper text and borders. <span className="font-mono">System</span> follows your OS setting.
                  </p>
                </div>
              </div>
              <div
                role="radiogroup"
                aria-label="High contrast"
                className="mt-3 flex gap-1"
              >
                {CONTRASTS.map(({ value, label }) => {
                  const active = mounted && settings.highContrast === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setSettings((s) => ({ ...s, highContrast: value }))}
                      className={cn(
                        'inline-flex h-9 flex-1 items-center justify-center border text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                        active
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-input bg-background hover:bg-accent hover:text-accent-foreground'
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
