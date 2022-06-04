import { dbApi } from "../mongodb.js";

import ua from "./ua.js";
import en from "./en.js";
import { usersLanguages } from "../index.js";
import { DEFAULT_LANGUAGE } from "./constants.js";

const languagesList = {
  ua,
  en,
};

const getFieldByPath = (obj, path) => {
  return path.split(".").reduce((prev, curr) => {
    return prev ? prev[curr] : undefined;
  }, obj);
};

const getTranslation = (path, language = DEFAULT_LANGUAGE, params) => {
  const lang = languagesList[language] || languagesList[DEFAULT_LANGUAGE];
  const translation = getFieldByPath(lang, path);

  if (!translation) {
    throw new Error(
      `Translation not found: "${path}" with language "${language}"`
    );
  }

  if (typeof translation === "function") {
    return translation(params);
  }
  return translation;
};

export const t = async (path, userId, params) => {
  const language = usersLanguages.get(userId);
  return getTranslation(path, language, params);
};

export const getPathByTranslation = async (translation, userId) => {
  const language = usersLanguages.get(userId) || DEFAULT_LANGUAGE;
  const lang = languagesList[language] || languagesList[DEFAULT_LANGUAGE];

  return getPathInObjectByValue(lang, translation);
};

export const getPathInObjectByValue = (obj, value) => {
  const keys = Object.keys(obj);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (obj[key] === value) {
      return key;
    } else if (typeof obj[key] === "object") {
      const result = getPathInObjectByValue(obj[key], value);
      if (result) {
        return `${key}.${result}`;
      }
    }
  }
  return null;
};

export const setMapLanguages = async (map) => {
  map.clear();
  const usersLanguages = (await dbApi.getAllUsers()).map(
    ({ _id: id, language }) => [id, language]
  );

  usersLanguages.forEach(([id, language]) => {
    map.set(id, language);
  });
};
