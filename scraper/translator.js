const axios = require('axios');

/**
 * 구글 번역 무료 API 엔드포인트를 이용하여 영어 텍스트를 한국어로 번역합니다.
 * @param {string} text 번역할 원문 (영어)
 * @param {string} targetLang 대상 언어 (기본값: 'ko')
 * @returns {Promise<string>} 번역된 텍스트
 */
async function translateText(text, targetLang = 'ko') {
  if (!text || text.trim() === '') return '';
  
  try {
    // 공백 정리 및 최대 글자 수 제약 (구글 무료 API의 URI 길이 한계 고려)
    let cleanText = text.replace(/\s+/g, ' ').trim();
    if (cleanText.length > 1500) {
      cleanText = cleanText.substring(0, 1500) + '...';
    }

    const url = 'https://translate.googleapis.com/translate_a/single';
    const response = await axios.get(url, {
      params: {
        client: 'gtx',
        sl: 'auto',
        tl: targetLang,
        dt: 't',
        q: cleanText
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 10000 // 10초 타임아웃
    });

    if (response.data && response.data[0]) {
      const translated = response.data[0].map(function(item) {
        return item[0];
      }).join('');
      return translated;
    }
    return text;
  } catch (error) {
    console.error('번역 실패 (원문 유지):', error.message);
    return text;
  }
}

/**
 * 비동기 처리에 지연 시간을 주기 위한 헬퍼 함수
 * @param {number} ms 밀리초
 */
function sleep(ms) {
  return new Promise(function(resolve) {
    setTimeout(resolve, ms);
  });
}

module.exports = {
  translateText,
  sleep
};
