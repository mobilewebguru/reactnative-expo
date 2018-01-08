import Expo from 'expo';

/**
 * See https://docs.expo.io/versions/v15.0.0/guides/preloading-and-caching-assets.html
 */
export function cacheImages(images) {
  return images.map(image => {
    if (typeof image === 'string') {
      return Image.prefetch(image);
    } else {
      return Expo.Asset.fromModule(image).downloadAsync();
    }
  });
}

/**
 * See link above
 */
export function cacheFonts(fonts) {
  return fonts.map(font => Expo.Font.loadAsync(font));
}
