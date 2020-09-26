# TODO and Bug list

## TODO

---

### Expected Feature additions

* Export calendar to external calendar
* Notification system
* Implement standard/metric units (in progress)

### Quality of life updates

* Add confirmation modal for large scale deletions (such as a recipe)
* Sort recipe variants on page: master -> favorites (in alpha) -> other (in alpha)
* Make loading scheme between pages that are less jarring when things suddenly load/remove
* Add toast feedback on successful events
* Implement quick recipe scaling
* Lazy load and handle image caching


## Known Bugs

---

* Currently cannot use AOT for builds - likely will need to migrate to ionic4 to solve
* Select/option dropdown background color
* Completing process step needs intermediate view while states change
* When navigating back from active batch to list in extras tab, pressing back once does not go back to the list, pressing back a second time goes back to the extras tab
* Background timers not showing in notifications
* Some form selects aren't showing initial selection
