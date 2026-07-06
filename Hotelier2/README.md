# Hotel Membership Tracker

Marriott Bonvoy, IHG One Rewards, World of Hyatt, Hilton Honors, ALL Accor 멤버십을 여행자 관점으로 비교하는 작은 localhost 대시보드입니다.

## 실행

```bash
npm start
```

브라우저에서 `http://127.0.0.1:4282`를 열면 됩니다.

## GitHub Pages 배포

이 앱은 정적 HTML/CSS/JS로 동작하므로 `Hotelier2/public` 폴더만 GitHub Pages에 배포하면 됩니다.

1. GitHub 저장소 Settings → Pages로 이동합니다.
2. Build and deployment Source를 `GitHub Actions`로 설정합니다.
3. `main` 브랜치에 push하면 `.github/workflows/deploy-hotelier2-pages.yml`이 `Hotelier2/public`을 배포합니다.

배포 후 주소는 보통 `https://<username>.github.io/<repository>/` 형식입니다.

## 포함된 화면

- Traveler Simulator: 숙박 수, 평균 객실가, 지역, 여행 스타일로 추천 순위 재계산
- My Status: 프로그램별 현재 등급, 올해 숙박 수, 보유 포인트 저장
- What I’ll Get: 예정된 여행 기준 혜택, 예상 달러 가치, 신뢰도, 적립 예상 포인트 비교
- League Overview: 프로그램별 강점과 현재 달성 티어
- Elite Ladder: 연간 숙박 수 기준 티어 사다리
- Perk Radar: 선택한 프로그램의 혜택 점수
- Benefit Matrix: 조식, 업그레이드, 라운지, 체크아웃, 마일스톤 비교
- Fine Print Heatmap: 혜택 명확성/예외 조항 체감 비교

## 데이터

데이터는 공식 멤버십 혜택 페이지를 기준으로 사람이 모델링한 정적 비교 데이터입니다. 점수는 분석용 모델이며 실제 포인트 가치는 여행 패턴, 지역, 호텔 브랜드 예외에 따라 달라집니다.
