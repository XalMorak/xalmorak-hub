import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { STRINGS, type Locale, type StringKey } from "@/lib/i18n";

const LocaleContext = createContext<{
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: StringKey) => string;
}>({
  locale: "mn",
  setLocale: () => undefined,
  t: (key) => STRINGS.mn[key],
});

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("mn");

  useEffect(() => {
    const saved = window.localStorage.getItem("xal-locale");
    if (saved === "en" || saved === "mn") setLocaleState(saved);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo(
    () => ({
      locale,
      setLocale: (next: Locale) => {
        setLocaleState(next);
        window.localStorage.setItem("xal-locale", next);
      },
      t: (key: StringKey) => STRINGS[locale][key],
    }),
    [locale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useI18n() {
  return useContext(LocaleContext);
}
