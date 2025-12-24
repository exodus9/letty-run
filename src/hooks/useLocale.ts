import { getLocaleFromStorage, translations, type Locale, type Translation } from "@/i18n/translations";
import { useEffect, useState } from "react";

export function useLocale() {
	const [locale, setLocale] = useState<Locale>(getLocaleFromStorage());
	const [t, setT] = useState<Translation>(translations[locale]);

	useEffect(() => {
		// localStorage 변경 감지
		const handleLocaleChange = () => {
			const newLocale = getLocaleFromStorage();
			setLocale(newLocale);
			setT(translations[newLocale]);
		};

		// 초기 로드 시 설정
		handleLocaleChange();

		// 커스텀 localeChange 이벤트 리스너 추가 (같은 탭에서의 변경 감지)
		window.addEventListener("localeChange", handleLocaleChange);

		// storage 이벤트 리스너 추가 (다른 탭에서의 변경 감지)
		window.addEventListener("storage", handleLocaleChange);

		return () => {
			window.removeEventListener("localeChange", handleLocaleChange);
			window.removeEventListener("storage", handleLocaleChange);
		};
	}, []);

	return { locale, t };
}
