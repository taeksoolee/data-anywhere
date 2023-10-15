# Data Anywhere
> 어디서든 데이터를 저장해서 데이터를 조회하는 사이트를 구현한다.

- 스프레드 시트 형태의 view 제공. (handsontable)
- 저장 버튼을 클릭해 url을 변경.
- 버튼으로 url (클립보드) 저장 기능 제공.
- 우측 하단 시크릿 폼으로 시크릿 코드 관리.
- 시크릿 코드가 일치하지 않으면 데이트 미노출.
- 시크릿 폼 저장할 때 
  - 한번 이상 저장 버튼을 실행한 화면에서는 url(hash) 변경
  - 저장 버튼이 실행되지 않은 화면에서는 변경된 시크릿 코드로 url(hash) 데이터를 다시 조회.

## Used
- handsontable
- fontawesome
- toastify
- cryptojs
- tippy
- popperjs