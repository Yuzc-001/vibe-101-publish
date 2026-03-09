# Chrome Extension V1 Test Checklist

## Basic flow
- [ ] Load unpacked extension successfully
- [ ] Popup opens normally
- [ ] Current page title and URL display correctly

## Send selected text
- [ ] Select text on a normal article page
- [ ] Right-click menu appears
- [ ] Clicking menu opens workspace
- [ ] Imported markdown contains title / source / content

## Extract current page
- [ ] Popup -> `抓取当前页内容`
- [ ] Workspace receives page text
- [ ] Empty extraction shows friendly error

## Open workspace only
- [ ] Popup -> `仅打开工作台`
- [ ] Local target opens correctly
- [ ] Production target opens correctly

## Edge cases
- [ ] Chrome internal pages fail gracefully
- [ ] Very short pages fail gracefully
- [ ] Long pages truncate without breaking
