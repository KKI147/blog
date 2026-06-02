let newsData = [];

// 소스별 영문 값을 한글명으로 매핑
function getSourceKo(source) {
  switch (source.toLowerCase()) {
    case 'openai':
      return 'OpenAI';
    case 'google ai':
      return 'Google AI';
    case 'anthropic':
      return 'Anthropic';
    case 'cursor':
      return 'Cursor';
    default:
      return source;
  }
}

// 소스별 뱃지 스타일 클래스 반환
function getSourceBadgeClass(source) {
  switch (source.toLowerCase()) {
    case 'openai':
      return 'badge-openai';
    case 'google ai':
      return 'badge-google-ai';
    case 'anthropic':
      return 'badge-anthropic';
    case 'cursor':
      return 'badge-cursor';
    default:
      return 'badge-default';
  }
}

// ISO Date를 읽기 좋은 한국어 포맷으로 변경
function formatDisplayDate(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return parts[0] + '년 ' + parseInt(parts[1], 10) + '월 ' + parseInt(parts[2], 10) + '일';
  }
  return dateStr;
}

// 스크랩된 시간 표시 포맷 (scrapedAt 기준)
function formatSyncTime(isoStr) {
  if (!isoStr) return '최근 정보 없음';
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return '최근 정보 없음';
    let hours = d.getHours();
    let minutes = d.getMinutes();
    if (hours < 10) hours = '0' + hours;
    if (minutes < 10) minutes = '0' + minutes;
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate() + ' ' + hours + ':' + minutes;
  } catch (e) {
    return '최근 정보 없음';
  }
}

// 뉴스 데이터 화면 렌더링
function renderNews(filter) {
  const $grid = $('#news-grid');
  $grid.empty();
  
  const filtered = [];
  for (let i = 0; i < newsData.length; i++) {
    const item = newsData[i];
    if (filter === 'all' || item.source.toLowerCase() === filter.toLowerCase()) {
      filtered.push(item);
    }
  }
  
  if (filtered.length === 0) {
    $grid.append(
      '<div class="empty-container">' +
      '  <p>해당 카테고리에 스크랩된 뉴스가 없습니다.</p>' +
      '</div>'
    );
    return;
  }
  
  for (let i = 0; i < filtered.length; i++) {
    const news = filtered[i];
    const badgeClass = getSourceBadgeClass(news.source);
    const sourceKo = getSourceKo(news.source);
    const displayDate = formatDisplayDate(news.date);
    
    const cardHtml = 
      '<div class="news-card" data-id="' + news.id + '">' +
      '  <div class="card-meta">' +
      '    <span class="source-badge ' + badgeClass + '">' + sourceKo + '</span>' +
      '    <span class="card-date">' + displayDate + '</span>' +
      '  </div>' +
      '  <h3>' + news.titleKo + '</h3>' +
      '  <div class="original-title">' + news.title + '</div>' +
      '  <p class="summary-ko">' + news.summaryKo + '</p>' +
      '  <div class="card-footer">' +
      '    더 보기' +
      '    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>' +
      '  </div>' +
      '</div>';
      
    $grid.append(cardHtml);
  }
}

// 모달 다이얼로그 채우기 및 열기
function openNewsModal(newsId) {
  let targetNews = null;
  for (let i = 0; i < newsData.length; i++) {
    if (newsData[i].id === newsId) {
      targetNews = newsData[i];
      break;
    }
  }
  
  if (!targetNews) return;
  
  const $modal = $('#news-modal');
  const badgeClass = getSourceBadgeClass(targetNews.source);
  const sourceKo = getSourceKo(targetNews.source);
  
  $('#modal-badge-container').html('<span class="source-badge ' + badgeClass + '">' + sourceKo + '</span>');
  $('#modal-date').text(formatDisplayDate(targetNews.date));
  $('#modal-title-ko').text(targetNews.titleKo);
  $('#modal-title-en').text(targetNews.title);
  $('#modal-content-ko').text(targetNews.summaryKo);
  $('#modal-content-en').text(targetNews.summary);
  $('#modal-link').attr('href', targetNews.url);
  
  $modal.show(0, function() {
    $(this).addClass('active');
    $('body').css('overflow', 'hidden'); // 본문 스크롤 방지
  });
}

// 모달 닫기
function closeNewsModal() {
  const $modal = $('#news-modal');
  $modal.removeClass('active');
  $('body').css('overflow', ''); // 본문 스크롤 허용
  setTimeout(function() {
    $modal.hide();
  }, 300); // 트랜지션 애니메이션 완료 후 hide
}

// 메인 초기화
$(document).ready(function() {
  const $grid = $('#news-grid');
  
  // 로딩 인디케이터 렌더링
  $grid.html(
    '<div class="loading-container">' +
    '  <div class="loading-spinner"></div>' +
    '  <p>최신 뉴스를 불러오는 중입니다...</p>' +
    '</div>'
  );
  
  // JSON 데이터 로드
  $.getJSON('data/news.json')
    .done(function(data) {
      newsData = data;
      
      // 최신 업데이트 시간 갱신
      if (newsData.length > 0) {
        let latestScrapedAt = newsData[0].scrapedAt;
        for (let i = 1; i < newsData.length; i++) {
          if (newsData[i].scrapedAt > latestScrapedAt) {
            latestScrapedAt = newsData[i].scrapedAt;
          }
        }
        $('#sync-time-text').text('최근 업데이트: ' + formatSyncTime(latestScrapedAt));
      } else {
        $('#sync-time-text').text('스크랩된 뉴스가 없습니다.');
      }
      
      renderNews('all');
    })
    .fail(function() {
      $grid.html(
        '<div class="empty-container">' +
        '  <p>뉴스 데이터를 불러오지 못했습니다. 백엔드 스크래퍼가 실행되었는지 확인해주세요.</p>' +
        '</div>'
      );
      $('#sync-time-text').text('데이터 로드 실패');
    });

  // 카테고리 필터 버튼 클릭 핸들러
  $('.filter-btn').on('click', function() {
    $('.filter-btn').removeClass('active');
    $(this).addClass('active');
    
    const filter = $(this).attr('data-filter');
    renderNews(filter);
  });
  
  // 뉴스 카드 클릭 (이벤트 위임)
  $grid.on('click', '.news-card', function() {
    const newsId = $(this).attr('data-id');
    openNewsModal(newsId);
  });
  
  // 모달 닫기
  $('#modal-close').on('click', function() {
    closeNewsModal();
  });
  
  // 모달 바깥 클릭 시 닫기
  $('#news-modal').on('click', function(e) {
    if ($(e.target).hasClass('modal-overlay')) {
      closeNewsModal();
    }
  });
});

