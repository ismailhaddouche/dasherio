import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import path from 'path';

export async function initI18n(): Promise<void> {
  await i18next.use(Backend).init({
    lng: 'es',
    fallbackLng: 'es',
    supportedLngs: ['es', 'en', 'fr'],
    backend: {
      loadPath: path.join(__dirname, '../locales/{{lng}}/translation.json'),
    },
    interpolation: { escapeValue: false },
  });
}
