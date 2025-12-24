import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export const getFlavorFromUrlOrStorage = (): string | undefined => {
	// First check URL (highest priority)
	const urlParams = new URLSearchParams(window.location.search);
	const urlFlavor = urlParams.get("flavor");

	// If URL has flavor, save it to localStorage and return it
	if (urlFlavor) {
		try {
			localStorage.setItem("flavor", urlFlavor);
		} catch (error) {
			console.error("Error saving flavor to localStorage:", error);
		}
		return urlFlavor;
	}

	// If no URL flavor, check localStorage
	try {
		const storedFlavor = localStorage.getItem("flavor");
		if (storedFlavor) {
			return storedFlavor;
		}
	} catch (error) {
		console.error("Error getting flavor from localStorage:", error);
	}

	return "idol";
};

export const getNicknameFromUrlOrStorage = (): string => {
	// First check URL (highest priority)
	const urlParams = new URLSearchParams(window.location.search);
	const urlNickname = urlParams.get("nickname");

	// If URL has nickname, save it to localStorage and return it
	if (urlNickname) {
		try {
			localStorage.setItem("nickname", urlNickname);
		} catch (error) {
			console.error("Error saving nickname to localStorage:", error);
		}
		return urlNickname;
	}

	// If no URL nickname, check localStorage
	try {
		const storedNickname = localStorage.getItem("nickname");
		if (storedNickname) {
			return storedNickname;
		}
	} catch (error) {
		console.error("Error getting nickname from localStorage:", error);
	}

	// Return default if no nickname found
	return "NONAME";
};

// Dispatch custom event when locale changes
const dispatchLocaleChangeEvent = () => {
	window.dispatchEvent(new CustomEvent("localeChange"));
};

export const getLocaleFromUrlOrStorage = (): string | undefined => {
	// First check query param
	try {
		const urlParams = new URLSearchParams(window.location.search);
		let urlLocale = urlParams.get("locale");
		if (urlLocale === "zh-cn") {
			urlLocale = "zh-CN";
		}
		if (urlLocale === "zh-tw") {
			urlLocale = "zh-TW";
		}
		if (urlLocale === "jp") {
			urlLocale = "ja";
		}

		// If URL has locale, save it to localStorage
		if (urlLocale) {
			try {
				localStorage.setItem("locale", urlLocale);
				dispatchLocaleChangeEvent();
			} catch (error) {
				console.error("Error saving locale to localStorage:", error);
			}
			return urlLocale;
		}

		const storedLocale = localStorage.getItem("locale");
		if (storedLocale) {
			return storedLocale;
		}
	} catch (error) {
		console.error("Error getting locale from localStorage:", error);
	}
	// If no localStorage locale, check URL

	return "en";
};
