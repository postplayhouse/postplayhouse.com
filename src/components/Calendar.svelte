<!-- end calendar component wrapper -->
<style>
  /*/
$test-color: #444;

$main-text: $test-color;
$main-bg: $test-color;
$subtle-bg: $test-color;
$subtle-border: $test-color;
$button: $test-color;
$button-hover: $test-color;
$button-tint: $test-color;
$button-hover-tint: $test-color;
$button-edge: $test-color;
$pop-bg: $test-color;
$pop-bg-text: $test-color;
$subtle-bg-subtle-text: $test-color;
$article-link: $test-color;
$article-link-hover: $test-color;
$pop-bg-link: $test-color;
$pop-bg-link-hover: $test-color;
$nav-sub-bg-hover: $test-color;
$subtle-bg-border-focus: $test-color;
$button-text: $test-color;
$input-placeholder: $test-color;
$main-bg-border: $test-color;
$alt-link-bg: $test-color;
$alt-link: $test-color;
$transparent-dark: $test-color;
$transparent-dark-complimentary-text: $test-color;
$transparent-pop-shadow: $test-color;
$subtle-bg-alt: $test-color;
$table-border-color: $test-color;
$article-link-visited: $test-color;
/**/
  .group:after,
  .wrapper:after {
    content: "";
    display: table;
    clear: both;
  }

  .no-break {
    white-space: nowrap;
  }

  .clear {
    clear: both;
  }

  .center {
    text-align: center;
  }

  .switcher {
    border: 1px solid #2b8609;
    border-radius: 3px;
    display: inline-block;
    text-align: center;
    margin-bottom: 30px;
  }
  .switcher a {
    display: inline-block;
    padding: 3px 10px;
    cursor: pointer;
  }
  @media (min-width: 1000px) {
    .switcher a {
      border-right: 1px solid #2b8609;
    }
  }
  .switcher a:hover {
    color: #2b8609;
    background-color: #eaefe4;
  }
  .switcher a:last-child {
    border-right: none;
  }
  .switcher a.active {
    background-color: #2b8609;
    color: #fff;
  }

  .captioned-image {
    background-color: #eaefe4;
    padding: 8px;
    margin: 20px;
  }
  .captioned-image img {
    margin-bottom: 8px;
    width: 100%;
  }
  .captioned-image .caption {
    text-align: center;
  }
  @media (min-width: 1000px) {
    .captioned-image .caption {
      font-size: 0.75em;
    }
  }

  @media (min-width: 1000px) {
    .six {
      width: 49%;
    }

    .four {
      width: 32%;
    }

    .three {
      width: 25%;
    }
  }
  .outlined {
    background-color: #eaefe4;
    padding: 8px;
  }

  .right {
    float: right;
    margin-right: 0;
  }

  .left {
    float: left;
    margin-left: 0;
  }

  @media (max-width: 999px) {
    .left.six,
    .left.four,
    .left.three,
    .right.six,
    .right.four,
    .right.three {
      float: none;
    }
  }
  @media (max-width: 999px) {
    .captioned-image.six.left,
    .captioned-image.six.right {
      float: none;
      margin-left: auto;
      margin-right: auto;
    }
  }

  .button {
    background: #33921b;
    /* Old browsers */
    background: -webkit-linear-gradient(top, #33921b 0%, #246713 100%);
    /* Chrome 10+, Safari 5.1+ */
    background: linear-gradient(to bottom, #33921b 0%, #246713 100%);
    /* W3C */
    border: none;
    border-bottom: 3px solid #153c0b;
    border-radius: 2px;
    color: #fff;
    display: inline-block;
    padding: 11px 24px 10px;
    text-decoration: none;
    font-size: 100%;
    color: #fff !important;
  }
  .button:hover,
  .button:focus {
    background: #4ad327;
    /* Old browsers */
    background: -webkit-linear-gradient(top, #4ad327 0%, #3ba81f 100%);
    /* Chrome 10+, Safari 5.1+ */
    background: linear-gradient(to bottom, #4ad327 0%, #3ba81f 100%);
    /* W3C */
    outline: none;
  }
  .button:active {
    background: #246713;
    /* Old browsers */
    background: -webkit-linear-gradient(top, #246713 0%, #33921b 100%);
    /* Chrome 10+, Safari 5.1+ */
    background: linear-gradient(to bottom, #246713 0%, #33921b 100%);
    /* W3C */
    border: none;
    border-top: 3px solid #153c0b;
    padding: 10px 24px 11px;
  }
  .button[disabled],
  .button[disabled]:hover,
  .button[disabled]:focus,
  .button[disabled]:active,
  .button.disabled,
  .button.disabled:hover,
  .button.disabled:focus,
  .button.disabled:active {
    background: #33921b;
    /* Old browsers */
    background: -webkit-linear-gradient(top, #33921b 0%, #246713 100%);
    /* Chrome 10+, Safari 5.1+ */
    background: linear-gradient(to bottom, #33921b 0%, #246713 100%);
    /* W3C */
    border: none;
    border-bottom: 3px solid #153c0b;
    border-radius: 2px;
    color: #fff;
    display: inline-block;
    padding: 11px 24px 10px;
    text-decoration: none;
    font-size: 100%;
    opacity: 0.5;
  }

  .calendar-component-wrapper {
    font-family: proxima-nova, sans-serif;
    background: #d1dcc4;
    font-size: 1.5rem;
  }
  .calendar-component-wrapper ul {
    padding: 0;
    margin: 0;
    list-style: none;
  }

  .calendar-filters .filter {
    background-color: #d1dcc4;
    margin: 2px;
    border: 1px solid #d1dcc4;
    color: #9fb684;
    float: left;
    font-family: proxima-nova, sans-serif;
    font-size: 2.625rem;
    padding: 0.3rem 0.78rem;
    line-height: 3rem;
  }
  .calendar-filters .filter:after {
    content: "";
    display: table;
    clear: both;
  }
  @media (min-width: 901px) {
    .calendar-filters .filter {
      font-size: 1.725rem;
      padding: 0.15rem 0.3rem;
      line-height: 2.25rem;
    }
  }
  @media (min-width: 575px) and (max-width: 900px) {
    .calendar-filters .filter {
      font-size: 1.125rem;
      padding: 0.075rem 0.15rem;
      line-height: 1.5rem;
    }
  }
  @media (max-width: 574px) {
    .calendar-filters .filter {
      font-size: 0.825rem;
      padding: 0.0375rem 0.075rem;
      line-height: 1.125rem;
    }
  }
  .calendar-filters .filter.selected {
    color: white;
  }
  .calendar-filters .filter.show-1 {
    border-color: #eecf8e;
    text-shadow: 0.035em 0.035em 0px #563f0d, 0.035em 0.07em 0px #563f0d;
  }
  .calendar-filters .filter.show-2 {
    border-color: #00d453;
    text-shadow: 0.035em 0.035em 0px #003b17, 0.035em 0.07em 0px #003b17;
  }
  .calendar-filters .filter.show-3 {
    border-color: #d04fcc;
    text-shadow: 0.035em 0.035em 0px #421140, 0.035em 0.07em 0px #421140;
  }
  .calendar-filters .filter.show-4 {
    border-color: #e27377;
    text-shadow: 0.035em 0.035em 0px #71181a, 0.035em 0.07em 0px #71181a;
  }
  .calendar-filters .filter.show-5 {
    border-color: #58a7e6;
    text-shadow: 0.035em 0.035em 0px #0f3e63, 0.035em 0.07em 0px #0f3e63;
  }
  .calendar-filters .filter.show-6,
  .calendar-filters .filter.show-7,
  .calendar-filters .filter.show-8,
  .calendar-filters .filter.show-9 {
    display: none;
  }
  .calendar-filters .filter.show-1.selected {
    background-color: #e0aa36;
  }
  .calendar-filters .filter.show-2.selected {
    background-color: #006e2b;
  }
  .calendar-filters .filter.show-3.selected {
    background-color: #92278f;
  }
  .calendar-filters .filter.show-4.selected {
    background-color: #c6292e;
  }
  .calendar-filters .filter.show-5.selected {
    background-color: #1c75bc;
  }

  .is-editing .proportional-wrapper {
    max-width: 100%;
  }

  .proportional-wrapper {
    max-width: 89rem;
    width: 100%;
  }
  @media (min-width: 91424px) {
    .proportional-wrapper .outer {
      width: 100%;
      padding-top: 150%;
      position: relative;
      overflow: visible;
    }
    .proportional-wrapper .inner {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
    }
  }

  .calendar {
    font-family: proxima-nova, sans-serif;
    padding: 1em;
    overflow: hidden;
    margin: auto;
  }

  .day.padding {
    border: none !important;
  }

  .day {
    border: 0 solid black;
    border-left-width: 1px;
  }
  .day:last-child {
    border-right-width: 1px;
  }

  .week {
    border: 0 solid black;
    border-bottom-width: 1px;
  }
  .week:first-child .day {
    border-top-width: 1px;
  }
  .week:last-child {
    border: none;
  }
  .week:last-child .day {
    position: relative;
    border-bottom-width: 1px;
    border-right-width: 0;
  }
  .week:last-child .day:after {
    content: "";
    border: 0 solid black;
    border-left-width: 1px;
    position: absolute;
    top: 0;
    right: -1px;
    bottom: -1px;
  }

  @media (min-width: 91424px) {
    .day {
      border-left-width: 2px;
    }
    .day:last-child {
      border-right-width: 2px;
    }

    .week {
      border-bottom-width: 2px;
    }
    .week:first-child .day {
      border-top-width: 2px;
    }
    .week:last-child .day {
      border-bottom-width: 2px;
    }
    .week:last-child .day:after {
      border-left-width: 2px;
      right: -2px;
      bottom: -2px;
    }
  }
  .week {
    display: flex;
    width: 100%;
  }

  .day {
    flex-basis: 15.3846153846%;
  }
  .day.monday {
    flex-basis: 7.6923076923%;
  }
  .day.monday .day-name .full {
    display: none;
  }
  .day.monday .day-name .short {
    display: inline;
  }

  .week:first-child .day:first-child {
    padding: 0;
    padding-bottom: 2px;
    flex-grow: 1;
  }

  .day {
    width: 14%;
    padding: 0.75%;
    background: white;
  }
  .day .month-holder {
    position: relative;
  }
  .day .month-name {
    display: none;
    color: black;
    font-family: azo-sans-uber, sans-serif;
    font-weight: bolder;
    position: absolute;
    background: transparent;
    font-size: 3.75rem;
    z-index: 2;
    transform: rotate(-15deg);
    top: -0.8em;
  }
  @media (min-width: 901px) {
    .day .month-name {
      font-size: 2.625rem;
    }
  }
  @media (min-width: 575px) and (max-width: 900px) {
    .day .month-name {
      font-size: 1.5rem;
    }
  }
  @media (max-width: 574px) {
    .day .month-name {
      font-size: 0.75rem;
      top: -1em;
      transform: rotate(0);
    }
  }
  .day.day-29 .month-name.may {
    display: block;
  }
  .day.day-2 .month-name.jun {
    display: block;
  }
  .day.day-1 .month-name.jul {
    display: block;
  }
  .day.day-1 .month-name.aug {
    transform: rotate(-10);
    display: block;
    top: -1em;
    left: 0.5em;
  }

  .day-name {
    display: none;
  }
  .day-name .short {
    display: none;
  }

  .day.error {
    background: red;
  }

  .day.dark {
    background: rgba(0, 0, 0, 0.4);
  }
  .day.dark .mday,
  .day.dark .day-name {
    color: white;
  }

  .day.padding {
    background: transparent;
  }

  .week:nth-child(2) .day .day-name {
    display: inline;
    font-family: proxima-nova-extra-condensed;
    color: black;
  }
  @media (max-width: 574px) {
    .week:nth-child(2) .monday .short {
      display: none;
    }
    .week:nth-child(2) .full {
      display: none;
    }
    .week:nth-child(2) .short {
      display: inline;
    }
  }
  .week:nth-child(2) .day.dark .day-name {
    color: white;
  }
  .week:nth-child(2) .tuesday .day-name {
    display: none;
  }

  .day-identifiers {
    font-size: 1.95rem;
    flex-basis: 1em;
    display: flex;
    justify-content: flex-end;
    align-items: baseline;
  }
  .day-identifiers > * {
    flex-grow: 1;
  }
  @media (min-width: 901px) {
    .day-identifiers {
      font-size: 1.5rem;
    }
  }
  @media (min-width: 575px) and (max-width: 900px) {
    .day-identifiers {
      font-size: 1.125rem;
    }
  }
  @media (max-width: 574px) {
    .day-identifiers {
      font-size: 0.75rem;
    }
  }

  .mday {
    font-family: proxima-nova-condensed;
    font-weight: 300;
    color: black;
    text-align: right;
    margin-bottom: 6px;
    line-height: 1;
  }

  .day-wrapper {
    display: flex;
    flex-direction: column;
    height: 100%;
    position: relative;
  }

  .announce-wrapper {
    background-color: #999;
    color: #fff;
    padding: 3px;
    font-size: 0.45em;
    line-height: 1;
    position: absolute;
    top: 1.3rem;
    text-align: center;
    width: 212%;
  }
  .announce-wrapper .short {
    display: none;
  }
  @media (max-width: 574px) {
    .announce-wrapper {
      font-size: 0.4em;
      top: 0.7rem;
      padding: 1px;
    }
    .announce-wrapper .short {
      display: inline;
    }
    .announce-wrapper .full {
      display: none;
    }
  }
  @media (min-width: 901px) {
    .announce-wrapper {
      font-size: 0.75em;
    }
  }

  .day-content {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
  }
  .day-content .spacer {
    flex-grow: 1;
    flex-basis: 1.2em;
  }
  @media (min-width: 575px) and (max-width: 900px) {
    .day-content .spacer {
      flex-basis: 0.75em;
    }
  }
  @media (max-width: 574px) {
    .day-content .spacer {
      flex-grow: 0;
      flex-basis: 0.5em;
    }
  }

  .showing {
    font-size: 1.8rem;
    font-weight: 400;
    text-align: center;
    background-color: grey;
    color: white;
    display: flex;
    justify-content: space-between;
    align-items: center;
    text-shadow: 0.035em 0.035em 0px black, 0.035em 0.07em 0px black;
  }
  @media (min-width: 901px) {
    .showing {
      font-size: 1.125rem;
    }
  }
  @media (min-width: 575px) and (max-width: 900px) {
    .showing {
      font-size: 0.75rem;
    }
  }
  @media (max-width: 574px) {
    .showing {
      font-size: 0.75rem;
      border-radius: 999em;
      margin-top: 1px;
      justify-content: center;
    }
  }
  .showing.show-1 {
    background-color: #e0aa36;
    text-shadow: 0.035em 0.035em 0px #563f0d, 0.035em 0.07em 0px #563f0d;
  }
  .showing.show-2 {
    background-color: #006e2b;
    text-shadow: 0.035em 0.035em 0px #003b17, 0.035em 0.07em 0px #003b17;
  }
  .showing.show-3 {
    background-color: #92278f;
    text-shadow: 0.035em 0.035em 0px #421140, 0.035em 0.07em 0px #421140;
  }
  .showing.show-4 {
    background-color: #c6292e;
    text-shadow: 0.035em 0.035em 0px #71181a, 0.035em 0.07em 0px #71181a;
  }
  .showing.show-5 {
    background-color: #1c75bc;
    text-shadow: 0.035em 0.035em 0px #0f3e63, 0.035em 0.07em 0px #0f3e63;
  }

  .show-count-1 .showing,
  .show-count-2 .showing {
    flex-basis: 2.16em;
  }
  @media (max-width: 574px) {
    .show-count-1 .showing,
    .show-count-2 .showing {
      flex-basis: 1em;
    }
  }

  .showing {
    flex-basis: 1.44em;
  }
  @media (max-width: 574px) {
    .showing {
      flex-basis: 1em;
    }
  }

  .show-time {
    font-family: proxima-nova-condensed;
    color: black;
    margin-left: 2%;
    text-shadow: none;
    text-align: center;
    background-color: white;
    width: 1.5em;
    border-radius: 10%;
    padding: 0.1em 0;
    line-height: 1;
  }
  @media (min-width: 575px) and (max-width: 900px) {
    .show-time {
      font-weight: bold;
      width: 1.75em;
    }
  }
  @media (max-width: 574px) {
    .show-time {
      font-weight: bold;
      color: white;
      background-color: transparent;
    }
  }

  .show-title {
    flex-grow: 1;
    white-space: nowrap;
  }
  @media (min-width: 575px) and (max-width: 900px) {
    .show-title {
      font-family: proxima-nova-condensed;
    }
  }
  @media (max-width: 574px) {
    .show-title {
      display: none;
    }
  }
</style>

<svelte:head>
  <style>
    main {
      max-width: 70em !important;
    }
  </style>
</svelte:head>

<div class="calendar-component-wrapper">
  <div class="proportional-wrapper">
    <div class="outer">
      <div class="inner">
        <div class="calendar">
          <ul class="week">
            <li class="day padding" colspan="5">
              <div class="calendar-filters">
                <div class="filter selected show-1">Cats</div>
                <div class="filter selected show-3">Church Basement Ladies</div>
                <div class="filter selected show-4">Annie</div>
                <div class="filter selected show-5">Catch Me If You Can</div>
                <div class="filter selected show-2">Damn Yankees</div>
              </div>
            </li>

            <li class="day day-29 friday">
              <div class="day-wrapper">
                <div class="day-identifiers">
                  <span class="day-name">
                    <span class="full">Friday</span>
                    <span class="short">Fri</span>
                  </span>
                  <div class="month-holder">
                    <span class="month-name may">May</span>
                  </div>
                  <span class="mday">29</span>
                </div>
                <ul class="day-content show-count-1">
                  <div class="spacer"></div>
                  <li class="showing evening show-1">
                    <span class="show-time">8p</span>
                    <span class="show-title">Cats</span>
                  </li>
                </ul>
              </div>
            </li>
            <li class="day day-30 saturday">
              <div class="day-wrapper">
                <div class="day-identifiers">
                  <span class="day-name">
                    <span class="full">Saturday</span>
                    <span class="short">Sat</span>
                  </span>
                  <div class="month-holder">
                    <span class="month-name may">May</span>
                  </div>
                  <span class="mday">30</span>
                </div>
                <ul class="day-content show-count-1">
                  <div class="spacer"></div>
                  <li class="showing evening show-1">
                    <span class="show-time">8p</span>
                    <span class="show-title">Cats</span>
                  </li>
                </ul>
              </div>
            </li>
          </ul>
          <!-- week -->

          <ul class="week">
            <!---->
            <li class="day day-31 sunday">
              <div class="day-wrapper">
                <div class="day-identifiers">
                  <span class="day-name">
                    <span class="full">Sunday</span>
                    <span class="short">Sun</span>
                  </span>
                  <div class="month-holder">
                    <span class="month-name may">May</span>
                  </div>
                  <span class="mday">31</span>
                </div>
                <ul class="day-content show-count-1">
                  <!---->
                  <li class="showing matinee show-1">
                    <span class="show-time">2p</span>
                    <span class="show-title">Cats</span>
                  </li>
                </ul>
              </div>
            </li>
            <li class="day dark day-1 monday">
              <div class="day-wrapper">
                <div class="day-identifiers">
                  <span class="day-name">
                    <span class="full">Monday</span>
                    <span class="short">Mon</span>
                  </span>
                  <div class="month-holder">
                    <span class="month-name jun">Jun</span>
                  </div>
                  <span class="mday">1</span>
                </div>
                <ul class="day-content show-count-0">
                  <!---->
                </ul>
              </div>
            </li>
            <li class="day day-2 tuesday">
              <div class="day-wrapper">
                <div class="day-identifiers">
                  <span class="day-name">
                    <span class="full">Tuesday</span>
                    <span class="short">Tue</span>
                  </span>
                  <div class="month-holder">
                    <span class="month-name jun">Jun</span>
                  </div>
                  <span class="mday">2</span>
                </div>
                <ul class="day-content show-count-1">
                  <div class="spacer"></div>
                  <li class="showing evening show-1">
                    <span class="show-time">8p</span>
                    <span class="show-title">Cats</span>
                  </li>
                </ul>
              </div>
            </li>
            <li class="day dark day-3 wednesday">
              <div class="day-wrapper">
                <div class="day-identifiers">
                  <span class="day-name">
                    <span class="full">Wednesday</span>
                    <span class="short">Wed</span>
                  </span>
                  <div class="month-holder">
                    <span class="month-name jun">Jun</span>
                  </div>
                  <span class="mday">3</span>
                </div>
                <ul class="day-content show-count-0">
                  <!---->
                </ul>
              </div>
            </li>
            <li class="day dark day-4 thursday">
              <div class="day-wrapper">
                <div class="day-identifiers">
                  <span class="day-name">
                    <span class="full">Thursday</span>
                    <span class="short">Thu</span>
                  </span>
                  <div class="month-holder">
                    <span class="month-name jun">Jun</span>
                  </div>
                  <span class="mday">4</span>
                </div>
                <ul class="day-content show-count-0">
                  <!---->
                </ul>
              </div>
            </li>
            <li class="day day-5 friday">
              <div class="day-wrapper">
                <div class="day-identifiers">
                  <span class="day-name">
                    <span class="full">Friday</span>
                    <span class="short">Fri</span>
                  </span>
                  <div class="month-holder">
                    <span class="month-name jun">Jun</span>
                  </div>
                  <span class="mday">5</span>
                </div>
                <ul class="day-content show-count-1">
                  <div class="spacer"></div>
                  <li class="showing evening show-2">
                    <span class="show-time">8p</span>
                    <span class="show-title">Yankees</span>
                  </li>
                </ul>
              </div>
            </li>
            <li class="day day-6 saturday">
              <div class="day-wrapper">
                <div class="day-identifiers">
                  <span class="day-name">
                    <span class="full">Saturday</span>
                    <span class="short">Sat</span>
                  </span>
                  <div class="month-holder">
                    <span class="month-name jun">Jun</span>
                  </div>
                  <span class="mday">6</span>
                </div>
                <ul class="day-content show-count-1">
                  <div class="spacer"></div>
                  <li class="showing evening show-2">
                    <span class="show-time">8p</span>
                    <span class="show-title">Yankees</span>
                  </li>
                </ul>
              </div>
            </li>
          </ul>
          <!-- week -->

          <ul class="week">
            <!---->
            <li class="day day-7 sunday">
              <div class="day-wrapper">
                <div class="day-identifiers">
                  <span class="day-name">
                    <span class="full">Sunday</span>
                    <span class="short">Sun</span>
                  </span>
                  <div class="month-holder">
                    <span class="month-name jun">Jun</span>
                  </div>
                  <span class="mday">7</span>
                </div>
                <ul class="day-content show-count-1">
                  <!---->
                  <li class="showing matinee show-2">
                    <span class="show-time">2p</span>
                    <span class="show-title">Yankees</span>
                  </li>
                </ul>
              </div>
            </li>
            <li class="day dark day-8 monday">
              <div class="day-wrapper">
                <div class="day-identifiers">
                  <span class="day-name">
                    <span class="full">Monday</span>
                    <span class="short">Mon</span>
                  </span>
                  <div class="month-holder">
                    <span class="month-name jun">Jun</span>
                  </div>
                  <span class="mday">8</span>
                </div>
                <ul class="day-content show-count-0">
                  <!---->
                </ul>
              </div>
            </li>
            <li class="day day-9 tuesday">
              <div class="day-wrapper">
                <div class="day-identifiers">
                  <span class="day-name">
                    <span class="full">Tuesday</span>
                    <span class="short">Tue</span>
                  </span>
                  <div class="month-holder">
                    <span class="month-name jun">Jun</span>
                  </div>
                  <span class="mday">9</span>
                </div>
                <ul class="day-content show-count-1">
                  <div class="spacer"></div>
                  <li class="showing evening show-1">
                    <span class="show-time">8p</span>
                    <span class="show-title">Cats</span>
                  </li>
                </ul>
              </div>
            </li>
            <li class="day dark day-10 wednesday">
              <div class="day-wrapper">
                <div class="day-identifiers">
                  <span class="day-name">
                    <span class="full">Wednesday</span>
                    <span class="short">Wed</span>
                  </span>
                  <div class="month-holder">
                    <span class="month-name jun">Jun</span>
                  </div>
                  <span class="mday">10</span>
                </div>
                <ul class="day-content show-count-0">
                  <!---->
                </ul>
              </div>
            </li>
            <li class="day dark day-11 thursday">
              <div class="day-wrapper">
                <div class="day-identifiers">
                  <span class="day-name">
                    <span class="full">Thursday</span>
                    <span class="short">Thu</span>
                  </span>
                  <div class="month-holder">
                    <span class="month-name jun">Jun</span>
                  </div>
                  <span class="mday">11</span>
                </div>
                <ul class="day-content show-count-0">
                  <!---->
                </ul>
              </div>
            </li>
            <li class="day day-12 friday">
              <div class="day-wrapper">
                <div class="day-identifiers">
                  <span class="day-name">
                    <span class="full">Friday</span>
                    <span class="short">Fri</span>
                  </span>
                  <div class="month-holder">
                    <span class="month-name jun">Jun</span>
                  </div>
                  <span class="mday">12</span>
                </div>
                <ul class="day-content show-count-1">
                  <div class="spacer"></div>
                  <li class="showing evening show-3">
                    <span class="show-time">8p</span>
                    <span class="show-title">Ladies</span>
                  </li>
                </ul>
              </div>
            </li>
            <li class="day day-13 saturday">
              <div class="day-wrapper">
                <div class="day-identifiers">
                  <span class="day-name">
                    <span class="full">Saturday</span>
                    <span class="short">Sat</span>
                  </span>
                  <div class="month-holder">
                    <span class="month-name jun">Jun</span>
                  </div>
                  <span class="mday">13</span>
                </div>
                <ul class="day-content show-count-1">
                  <div class="spacer"></div>
                  <li class="showing evening show-3">
                    <span class="show-time">8p</span>
                    <span class="show-title">Ladies</span>
                  </li>
                </ul>
              </div>
            </li>
          </ul>
          <!-- week -->

          <ul class="week">
            <!---->
            <li class="day day-14 sunday">
              <div class="day-wrapper">
                <div class="day-identifiers">
                  <span class="day-name">
                    <span class="full">Sunday</span>
                    <span class="short">Sun</span>
                  </span>
                  <div class="month-holder">
                    <span class="month-name jun">Jun</span>
                  </div>
                  <span class="mday">14</span>
                </div>
                <ul class="day-content show-count-1">
                  <!---->
                  <li class="showing matinee show-3">
                    <span class="show-time">2p</span>
                    <span class="show-title">Ladies</span>
                  </li>
                </ul>
              </div>
            </li>
            <li class="day dark day-15 monday">
              <div class="day-wrapper">
                <div class="day-identifiers">
                  <span class="day-name">
                    <span class="full">Monday</span>
                    <span class="short">Mon</span>
                  </span>
                  <div class="month-holder">
                    <span class="month-name jun">Jun</span>
                  </div>
                  <span class="mday">15</span>
                </div>
                <ul class="day-content show-count-0">
                  <!---->
                </ul>
              </div>
            </li>
            <li class="day day-16 tuesday">
              <div class="day-wrapper">
                <div class="day-identifiers">
                  <span class="day-name">
                    <span class="full">Tuesday</span>
                    <span class="short">Tue</span>
                  </span>
                  <div class="month-holder">
                    <span class="month-name jun">Jun</span>
                  </div>
                  <span class="mday">16</span>
                </div>
                <ul class="day-content show-count-1">
                  <div class="spacer"></div>
                  <li class="showing evening show-2">
                    <span class="show-time">8p</span>
                    <span class="show-title">Yankees</span>
                  </li>
                </ul>
              </div>
            </li>
            <li class="day day-17 wednesday">
              <div class="day-wrapper">
                <div class="day-identifiers">
                  <span class="day-name">
                    <span class="full">Wednesday</span>
                    <span class="short">Wed</span>
                  </span>
                  <div class="month-holder">
                    <span class="month-name jun">Jun</span>
                  </div>
                  <span class="mday">17</span>
                </div>
                <ul class="day-content show-count-1">
                  <div class="spacer"></div>
                  <li class="showing evening show-3">
                    <span class="show-time">8p</span>
                    <span class="show-title">Ladies</span>
                  </li>
                </ul>
              </div>
            </li>
            <li class="day day-18 thursday">
              <div class="day-wrapper">
                <div class="day-identifiers">
                  <span class="day-name">
                    <span class="full">Thursday</span>
                    <span class="short">Thu</span>
                  </span>
                  <div class="month-holder">
                    <span class="month-name jun">Jun</span>
                  </div>
                  <span class="mday">18</span>
                </div>
                <ul class="day-content show-count-1">
                  <div class="spacer"></div>
                  <li class="showing evening show-1">
                    <span class="show-time">8p</span>
                    <span class="show-title">Cats</span>
                  </li>
                </ul>
              </div>
            </li>
            <li class="day day-19 friday">
              <div class="day-wrapper">
                <div class="day-identifiers">
                  <span class="day-name">
                    <span class="full">Friday</span>
                    <span class="short">Fri</span>
                  </span>
                  <div class="month-holder">
                    <span class="month-name jun">Jun</span>
                  </div>
                  <span class="mday">19</span>
                </div>
                <ul class="day-content show-count-1">
                  <div class="spacer"></div>
                  <li class="showing evening show-2">
                    <span class="show-time">8p</span>
                    <span class="show-title">Yankees</span>
                  </li>
                </ul>
              </div>
            </li>
            <li class="day day-20 saturday">
              <div class="day-wrapper">
                <div class="day-identifiers">
                  <span class="day-name">
                    <span class="full">Saturday</span>
                    <span class="short">Sat</span>
                  </span>
                  <div class="month-holder">
                    <span class="month-name jun">Jun</span>
                  </div>
                  <span class="mday">20</span>
                </div>
                <ul class="day-content show-count-1">
                  <div class="spacer"></div>
                  <li class="showing evening show-3">
                    <span class="show-time">8p</span>
                    <span class="show-title">Ladies</span>
                  </li>
                </ul>
              </div>
            </li>
          </ul>
          <!-- week -->

          <ul class="week">
            <!---->
            <li class="day day-21 sunday">
              <div class="day-wrapper">
                <div class="day-identifiers">
                  <span class="day-name">
                    <span class="full">Sunday</span>
                    <span class="short">Sun</span>
                  </span>
                  <div class="month-holder">
                    <span class="month-name jun">Jun</span>
                  </div>
                  <span class="mday">21</span>
                </div>
                <ul class="day-content show-count-1">
                  <!---->
                  <li class="showing matinee show-1">
                    <span class="show-time">2p</span>
                    <span class="show-title">Cats</span>
                  </li>
                </ul>
              </div>
            </li>
            <li class="day dark day-22 monday">
              <div class="day-wrapper">
                <div class="day-identifiers">
                  <span class="day-name">
                    <span class="full">Monday</span>
                    <span class="short">Mon</span>
                  </span>
                  <div class="month-holder">
                    <span class="month-name jun">Jun</span>
                  </div>
                  <span class="mday">22</span>
                </div>
                <ul class="day-content show-count-0">
                  <!---->
                </ul>
              </div>
            </li>
            <li class="day day-23 tuesday">
              <div class="day-wrapper">
                <div class="day-identifiers">
                  <span class="day-name">
                    <span class="full">Tuesday</span>
                    <span class="short">Tue</span>
                  </span>
                  <div class="month-holder">
                    <span class="month-name jun">Jun</span>
                  </div>
                  <span class="mday">23</span>
                </div>
                <ul class="day-content show-count-1">
                  <div class="spacer"></div>
                  <li class="showing evening show-1">
                    <span class="show-time">8p</span>
                    <span class="show-title">Cats</span>
                  </li>
                </ul>
              </div>
            </li>
            <li class="day dark day-24 wednesday">
              <div class="day-wrapper">
                <div class="day-identifiers">
                  <span class="day-name">
                    <span class="full">Wednesday</span>
                    <span class="short">Wed</span>
                  </span>
                  <div class="month-holder">
                    <span class="month-name jun">Jun</span>
                  </div>
                  <span class="mday">24</span>
                </div>
                <ul class="day-content show-count-0">
                  <!---->
                </ul>
              </div>
            </li>
            <li class="day dark day-25 thursday">
              <div class="day-wrapper">
                <div class="day-identifiers">
                  <span class="day-name">
                    <span class="full">Thursday</span>
                    <span class="short">Thu</span>
                  </span>
                  <div class="month-holder">
                    <span class="month-name jun">Jun</span>
                  </div>
                  <span class="mday">25</span>
                </div>
                <ul class="day-content show-count-0">
                  <!---->
                </ul>
              </div>
            </li>
            <li class="day day-26 friday">
              <div class="day-wrapper">
                <div class="day-identifiers">
                  <span class="day-name">
                    <span class="full">Friday</span>
                    <span class="short">Fri</span>
                  </span>
                  <div class="month-holder">
                    <span class="month-name jun">Jun</span>
                  </div>
                  <span class="mday">26</span>
                </div>
                <ul class="day-content show-count-1">
                  <div class="spacer"></div>
                  <li class="showing evening show-4">
                    <span class="show-time">8p</span>
                    <span class="show-title">Annie</span>
                  </li>
                </ul>
              </div>
            </li>
            <li class="day day-27 saturday">
              <div class="day-wrapper">
                <div class="day-identifiers">
                  <span class="day-name">
                    <span class="full">Saturday</span>
                    <span class="short">Sat</span>
                  </span>
                  <div class="month-holder">
                    <span class="month-name jun">Jun</span>
                  </div>
                  <span class="mday">27</span>
                </div>
                <ul class="day-content show-count-1">
                  <div class="spacer"></div>
                  <li class="showing evening show-4">
                    <span class="show-time">8p</span>
                    <span class="show-title">Annie</span>
                  </li>
                </ul>
              </div>
            </li>
          </ul>
          <!-- week -->

          <ul class="week">
            <!---->
            <li class="day day-28 sunday">
              <div class="day-wrapper">
                <div class="day-identifiers">
                  <span class="day-name">
                    <span class="full">Sunday</span>
                    <span class="short">Sun</span>
                  </span>
                  <div class="month-holder">
                    <span class="month-name jun">Jun</span>
                  </div>
                  <span class="mday">28</span>
                </div>
                <ul class="day-content show-count-1">
                  <!---->
                  <li class="showing matinee show-4">
                    <span class="show-time">2p</span>
                    <span class="show-title">Annie</span>
                  </li>
                </ul>
              </div>
            </li>
            <li class="day dark day-29 monday">
              <div class="day-wrapper">
                <div class="day-identifiers">
                  <span class="day-name">
                    <span class="full">Monday</span>
                    <span class="short">Mon</span>
                  </span>
                  <div class="month-holder">
                    <span class="month-name jun">Jun</span>
                  </div>
                  <span class="mday">29</span>
                </div>
                <ul class="day-content show-count-0">
                  <!---->
                </ul>
              </div>
            </li>
            <li class="day day-30 tuesday">
              <div class="day-wrapper">
                <div class="day-identifiers">
                  <span class="day-name">
                    <span class="full">Tuesday</span>
                    <span class="short">Tue</span>
                  </span>
                  <div class="month-holder">
                    <span class="month-name jun">Jun</span>
                  </div>
                  <span class="mday">30</span>
                </div>
                <ul class="day-content show-count-1">
                  <div class="spacer"></div>
                  <li class="showing evening show-2">
                    <span class="show-time">8p</span>
                    <span class="show-title">Yankees</span>
                  </li>
                </ul>
              </div>
            </li>
            <li class="day day-1 wednesday">
              <div class="day-wrapper">
                <div class="day-identifiers">
                  <span class="day-name">
                    <span class="full">Wednesday</span>
                    <span class="short">Wed</span>
                  </span>
                  <div class="month-holder">
                    <span class="month-name jul">Jul</span>
                  </div>
                  <span class="mday">1</span>
                </div>
                <ul class="day-content show-count-1">
                  <div class="spacer"></div>
                  <li class="showing evening show-3">
                    <span class="show-time">8p</span>
                    <span class="show-title">Ladies</span>
                  </li>
                </ul>
              </div>
            </li>
            <li class="day dark day-2 thursday">
              <div class="day-wrapper">
                <div class="day-identifiers">
                  <span class="day-name">
                    <span class="full">Thursday</span>
                    <span class="short">Thu</span>
                  </span>
                  <div class="month-holder">
                    <span class="month-name jul">Jul</span>
                  </div>
                  <span class="mday">2</span>
                </div>
                <ul class="day-content show-count-0">
                  <!---->
                </ul>
              </div>
            </li>
            <li class="day day-3 friday">
              <div class="day-wrapper">
                <div class="day-identifiers">
                  <span class="day-name">
                    <span class="full">Friday</span>
                    <span class="short">Fri</span>
                  </span>
                  <div class="month-holder">
                    <span class="month-name jul">Jul</span>
                  </div>
                  <span class="mday">3</span>
                </div>
                <ul class="day-content show-count-1">
                  <div class="spacer"></div>
                  <li class="showing evening show-5">
                    <span class="show-time">8p</span>
                    <span class="show-title">Catch</span>
                  </li>
                </ul>
              </div>
            </li>
            <li class="day day-4 saturday">
              <div class="day-wrapper">
                <div class="day-identifiers">
                  <span class="day-name">
                    <span class="full">Saturday</span>
                    <span class="short">Sat</span>
                  </span>
                  <div class="month-holder">
                    <span class="month-name jul">Jul</span>
                  </div>
                  <span class="mday">4</span>
                </div>
                <ul class="day-content show-count-2">
                  <!---->
                  <li class="showing matinee show-1">
                    <span class="show-time">2p</span>
                    <span class="show-title">Cats</span>
                  </li>
                  <!---->
                  <li class="showing evening show-5">
                    <span class="show-time">8p</span>
                    <span class="show-title">Catch</span>
                  </li>
                </ul>
              </div>
            </li>
          </ul>
          <!-- week -->

          <ul class="week">
            <!---->
            <li class="day day-5 sunday">
              <div class="day-wrapper">
                <div class="day-identifiers">
                  <span class="day-name">
                    <span class="full">Sunday</span>
                    <span class="short">Sun</span>
                  </span>
                  <div class="month-holder">
                    <span class="month-name jul">Jul</span>
                  </div>
                  <span class="mday">5</span>
                </div>
                <ul class="day-content show-count-1">
                  <!---->
                  <li class="showing matinee show-5">
                    <span class="show-time">2p</span>
                    <span class="show-title">Catch</span>
                  </li>
                </ul>
              </div>
            </li>
            <li class="day dark day-6 monday">
              <div class="day-wrapper">
                <div class="day-identifiers">
                  <span class="day-name">
                    <span class="full">Monday</span>
                    <span class="short">Mon</span>
                  </span>
                  <div class="month-holder">
                    <span class="month-name jul">Jul</span>
                  </div>
                  <span class="mday">6</span>
                </div>
                <ul class="day-content show-count-0">
                  <!---->
                </ul>
              </div>
            </li>
            <li class="day day-7 tuesday">
              <div class="day-wrapper">
                <div class="day-identifiers">
                  <span class="day-name">
                    <span class="full">Tuesday</span>
                    <span class="short">Tue</span>
                  </span>
                  <div class="month-holder">
                    <span class="month-name jul">Jul</span>
                  </div>
                  <span class="mday">7</span>
                </div>
                <ul class="day-content show-count-1">
                  <div class="spacer"></div>
                  <li class="showing evening show-4">
                    <span class="show-time">8p</span>
                    <span class="show-title">Annie</span>
                  </li>
                </ul>
              </div>
            </li>
            <li class="day day-8 wednesday">
              <div class="day-wrapper">
                <div class="day-identifiers">
                  <span class="day-name">
                    <span class="full">Wednesday</span>
                    <span class="short">Wed</span>
                  </span>
                  <div class="month-holder">
                    <span class="month-name jul">Jul</span>
                  </div>
                  <span class="mday">8</span>
                </div>
                <ul class="day-content show-count-1">
                  <div class="spacer"></div>
                  <li class="showing evening show-2">
                    <span class="show-time">8p</span>
                    <span class="show-title">Yankees</span>
                  </li>
                </ul>
              </div>
            </li>
            <li class="day day-9 thursday">
              <div class="day-wrapper">
                <div class="day-identifiers">
                  <span class="day-name">
                    <span class="full">Thursday</span>
                    <span class="short">Thu</span>
                  </span>
                  <div class="month-holder">
                    <span class="month-name jul">Jul</span>
                  </div>
                  <span class="mday">9</span>
                </div>
                <ul class="day-content show-count-2">
                  <!---->
                  <li class="showing matinee show-4">
                    <span class="show-time">2p</span>
                    <span class="show-title">Annie</span>
                  </li>
                  <!---->
                  <li class="showing evening show-3">
                    <span class="show-time">8p</span>
                    <span class="show-title">Ladies</span>
                  </li>
                </ul>
              </div>
            </li>
            <li class="day day-10 friday">
              <div class="day-wrapper">
                <div class="day-identifiers">
                  <span class="day-name">
                    <span class="full">Friday</span>
                    <span class="short">Fri</span>
                  </span>
                  <div class="month-holder">
                    <span class="month-name jul">Jul</span>
                  </div>
                  <span class="mday">10</span>
                </div>
                <ul class="day-content show-count-2">
                  <!---->
                  <li class="showing matinee show-2">
                    <span class="show-time">2p</span>
                    <span class="show-title">Yankees</span>
                  </li>
                  <!---->
                  <li class="showing evening show-1">
                    <span class="show-time">8p</span>
                    <span class="show-title">Cats</span>
                  </li>
                </ul>
              </div>
            </li>
            <li class="day day-11 saturday">
              <div class="day-wrapper">
                <div class="day-identifiers">
                  <span class="day-name">
                    <span class="full">Saturday</span>
                    <span class="short">Sat</span>
                  </span>
                  <div class="month-holder">
                    <span class="month-name jul">Jul</span>
                  </div>
                  <span class="mday">11</span>
                </div>
                <ul class="day-content show-count-3">
                  <!---->
                  <li class="showing morning show-4">
                    <span class="show-time">10a</span>
                    <span class="show-title">Annie</span>
                  </li>
                  <!---->
                  <li class="showing matinee show-3">
                    <span class="show-time">2p</span>
                    <span class="show-title">Ladies</span>
                  </li>
                  <!---->
                  <li class="showing evening show-5">
                    <span class="show-time">8p</span>
                    <span class="show-title">Catch</span>
                  </li>
                </ul>
              </div>
            </li>
          </ul>
          <!-- week -->

          <ul class="week">
            <!---->
            <li class="day day-12 sunday">
              <div class="day-wrapper">
                <div class="day-identifiers">
                  <span class="day-name">
                    <span class="full">Sunday</span>
                    <span class="short">Sun</span>
                  </span>
                  <div class="month-holder">
                    <span class="month-name jul">Jul</span>
                  </div>
                  <span class="mday">12</span>
                </div>
                <ul class="day-content show-count-1">
                  <!---->
                  <li class="showing matinee show-1">
                    <span class="show-time">2p</span>
                    <span class="show-title">Cats</span>
                  </li>
                </ul>
              </div>
            </li>
            <li class="day dark day-13 monday">
              <div class="day-wrapper">
                <div class="day-identifiers">
                  <span class="day-name">
                    <span class="full">Monday</span>
                    <span class="short">Mon</span>
                  </span>
                  <div class="month-holder">
                    <span class="month-name jul">Jul</span>
                  </div>
                  <span class="mday">13</span>
                </div>
                <ul class="day-content show-count-0">
                  <!---->
                </ul>
              </div>
            </li>
            <li class="day day-14 tuesday">
              <div class="day-wrapper">
                <div class="day-identifiers">
                  <span class="day-name">
                    <span class="full">Tuesday</span>
                    <span class="short">Tue</span>
                  </span>
                  <div class="month-holder">
                    <span class="month-name jul">Jul</span>
                  </div>
                  <span class="mday">14</span>
                </div>
                <ul class="day-content show-count-1">
                  <div class="spacer"></div>
                  <li class="showing evening show-1">
                    <span class="show-time">8p</span>
                    <span class="show-title">Cats</span>
                  </li>
                </ul>
              </div>
            </li>
            <li class="day day-15 wednesday">
              <div class="day-wrapper">
                <div class="day-identifiers">
                  <span class="day-name">
                    <span class="full">Wednesday</span>
                    <span class="short">Wed</span>
                  </span>
                  <div class="month-holder">
                    <span class="month-name jul">Jul</span>
                  </div>
                  <span class="mday">15</span>
                </div>
                <div class="announce-wrapper">
                  <span class="full">Performances in Lead, SD!</span>
                  <span class="short">Lead, SD Shows!</span>
                </div>
                <ul class="day-content show-count-1">
                  <div class="spacer"></div>
                  <li class="showing evening show-9">
                    <span class="show-time">7p</span>
                    <span class="show-title">Ladies</span>
                  </li>
                </ul>
              </div>
            </li>
            <li class="day day-16 thursday">
              <div class="day-wrapper">
                <div class="day-identifiers">
                  <span class="day-name">
                    <span class="full">Thursday</span>
                    <span class="short">Thu</span>
                  </span>
                  <div class="month-holder">
                    <span class="month-name jul">Jul</span>
                  </div>
                  <span class="mday">16</span>
                </div>
                <ul class="day-content show-count-1">
                  <div class="spacer"></div>
                  <li class="showing evening show-9">
                    <span class="show-time">7p</span>
                    <span class="show-title">Ladies</span>
                  </li>
                </ul>
              </div>
            </li>
            <li class="day day-17 friday">
              <div class="day-wrapper">
                <div class="day-identifiers">
                  <span class="day-name">
                    <span class="full">Friday</span>
                    <span class="short">Fri</span>
                  </span>
                  <div class="month-holder">
                    <span class="month-name jul">Jul</span>
                  </div>
                  <span class="mday">17</span>
                </div>
                <ul class="day-content show-count-2">
                  <!---->
                  <li class="showing matinee show-3">
                    <span class="show-time">2p</span>
                    <span class="show-title">Ladies</span>
                  </li>
                  <!---->
                  <li class="showing evening show-5">
                    <span class="show-time">8p</span>
                    <span class="show-title">Catch</span>
                  </li>
                </ul>
              </div>
            </li>
            <li class="day day-18 saturday">
              <div class="day-wrapper">
                <div class="day-identifiers">
                  <span class="day-name">
                    <span class="full">Saturday</span>
                    <span class="short">Sat</span>
                  </span>
                  <div class="month-holder">
                    <span class="month-name jul">Jul</span>
                  </div>
                  <span class="mday">18</span>
                </div>
                <ul class="day-content show-count-3">
                  <!---->
                  <li class="showing morning show-4">
                    <span class="show-time">10a</span>
                    <span class="show-title">Annie</span>
                  </li>
                  <!---->
                  <li class="showing matinee show-2">
                    <span class="show-time">2p</span>
                    <span class="show-title">Yankees</span>
                  </li>
                  <!---->
                  <li class="showing evening show-1">
                    <span class="show-time">8p</span>
                    <span class="show-title">Cats</span>
                  </li>
                </ul>
              </div>
            </li>
          </ul>
          <!-- week -->

          <ul class="week">
            <!---->
            <li class="day day-19 sunday">
              <div class="day-wrapper">
                <div class="day-identifiers">
                  <span class="day-name">
                    <span class="full">Sunday</span>
                    <span class="short">Sun</span>
                  </span>
                  <div class="month-holder">
                    <span class="month-name jul">Jul</span>
                  </div>
                  <span class="mday">19</span>
                </div>
                <ul class="day-content show-count-1">
                  <!---->
                  <li class="showing matinee show-2">
                    <span class="show-time">2p</span>
                    <span class="show-title">Yankees</span>
                  </li>
                </ul>
              </div>
            </li>
            <li class="day dark day-20 monday">
              <div class="day-wrapper">
                <div class="day-identifiers">
                  <span class="day-name">
                    <span class="full">Monday</span>
                    <span class="short">Mon</span>
                  </span>
                  <div class="month-holder">
                    <span class="month-name jul">Jul</span>
                  </div>
                  <span class="mday">20</span>
                </div>
                <ul class="day-content show-count-0">
                  <!---->
                </ul>
              </div>
            </li>
            <li class="day day-21 tuesday">
              <div class="day-wrapper">
                <div class="day-identifiers">
                  <span class="day-name">
                    <span class="full">Tuesday</span>
                    <span class="short">Tue</span>
                  </span>
                  <div class="month-holder">
                    <span class="month-name jul">Jul</span>
                  </div>
                  <span class="mday">21</span>
                </div>
                <ul class="day-content show-count-1">
                  <div class="spacer"></div>
                  <li class="showing evening show-4">
                    <span class="show-time">8p</span>
                    <span class="show-title">Annie</span>
                  </li>
                </ul>
              </div>
            </li>
            <li class="day day-22 wednesday">
              <div class="day-wrapper">
                <div class="day-identifiers">
                  <span class="day-name">
                    <span class="full">Wednesday</span>
                    <span class="short">Wed</span>
                  </span>
                  <div class="month-holder">
                    <span class="month-name jul">Jul</span>
                  </div>
                  <span class="mday">22</span>
                </div>
                <div class="announce-wrapper">
                  <span class="full">Performances in Lead, SD!</span>
                  <span class="short">Lead, SD Shows!</span>
                </div>
                <ul class="day-content show-count-1">
                  <div class="spacer"></div>
                  <!---->
                  <li class="showing evening show-8">
                    <span class="show-time">7p</span>
                    <span class="show-title">Yankees</span>
                  </li>
                </ul>
              </div>
            </li>
            <li class="day day-23 thursday">
              <div class="day-wrapper">
                <div class="day-identifiers">
                  <span class="day-name">
                    <span class="full">Thursday</span>
                    <span class="short">Thu</span>
                  </span>
                  <div class="month-holder">
                    <span class="month-name jul">Jul</span>
                  </div>
                  <span class="mday">23</span>
                </div>
                <ul class="day-content show-count-1">
                  <div class="spacer"></div>
                  <!---->
                  <li class="showing evening show-8">
                    <span class="show-time">7p</span>
                    <span class="show-title">Yankees</span>
                  </li>
                </ul>
              </div>
            </li>
            <li class="day day-24 friday">
              <div class="day-wrapper">
                <div class="day-identifiers">
                  <span class="day-name">
                    <span class="full">Friday</span>
                    <span class="short">Fri</span>
                  </span>
                  <div class="month-holder">
                    <span class="month-name jul">Jul</span>
                  </div>
                  <span class="mday">24</span>
                </div>
                <ul class="day-content show-count-2">
                  <!---->
                  <li class="showing matinee show-3">
                    <span class="show-time">2p</span>
                    <span class="show-title">Ladies</span>
                  </li>
                  <!---->
                  <li class="showing evening show-2">
                    <span class="show-time">8p</span>
                    <span class="show-title">Yankees</span>
                  </li>
                </ul>
              </div>
            </li>
            <li class="day day-25 saturday">
              <div class="day-wrapper">
                <div class="day-identifiers">
                  <span class="day-name">
                    <span class="full">Saturday</span>
                    <span class="short">Sat</span>
                  </span>
                  <div class="month-holder">
                    <span class="month-name jul">Jul</span>
                  </div>
                  <span class="mday">25</span>
                </div>
                <ul class="day-content show-count-3">
                  <!---->
                  <li class="showing morning show-1">
                    <span class="show-time">10a</span>
                    <span class="show-title">Cats</span>
                  </li>
                  <!---->
                  <li class="showing matinee show-4">
                    <span class="show-time">2p</span>
                    <span class="show-title">Annie</span>
                  </li>
                  <!---->
                  <li class="showing evening show-5">
                    <span class="show-time">8p</span>
                    <span class="show-title">Catch</span>
                  </li>
                </ul>
              </div>
            </li>
          </ul>
          <!-- week -->

          <ul class="week">
            <!---->
            <li class="day day-26 sunday">
              <div class="day-wrapper">
                <div class="day-identifiers">
                  <span class="day-name">
                    <span class="full">Sunday</span>
                    <span class="short">Sun</span>
                  </span>
                  <div class="month-holder">
                    <span class="month-name jul">Jul</span>
                  </div>
                  <span class="mday">26</span>
                </div>
                <ul class="day-content show-count-1">
                  <!---->
                  <li class="showing matinee show-4">
                    <span class="show-time">2p</span>
                    <span class="show-title">Annie</span>
                  </li>
                </ul>
              </div>
            </li>
            <li class="day dark day-27 monday">
              <div class="day-wrapper">
                <div class="day-identifiers">
                  <span class="day-name">
                    <span class="full">Monday</span>
                    <span class="short">Mon</span>
                  </span>
                  <div class="month-holder">
                    <span class="month-name jul">Jul</span>
                  </div>
                  <span class="mday">27</span>
                </div>
                <ul class="day-content show-count-0">
                  <!---->
                </ul>
              </div>
            </li>
            <li class="day day-28 tuesday">
              <div class="day-wrapper">
                <div class="day-identifiers">
                  <span class="day-name">
                    <span class="full">Tuesday</span>
                    <span class="short">Tue</span>
                  </span>
                  <div class="month-holder">
                    <span class="month-name jul">Jul</span>
                  </div>
                  <span class="mday">28</span>
                </div>
                <ul class="day-content show-count-1">
                  <div class="spacer"></div>
                  <li class="showing evening show-4">
                    <span class="show-time">8p</span>
                    <span class="show-title">Annie</span>
                  </li>
                </ul>
              </div>
            </li>
            <li class="day day-29 wednesday">
              <div class="day-wrapper">
                <div class="day-identifiers">
                  <span class="day-name">
                    <span class="full">Wednesday</span>
                    <span class="short">Wed</span>
                  </span>
                  <div class="month-holder">
                    <span class="month-name jul">Jul</span>
                  </div>
                  <span class="mday">29</span>
                </div>
                <ul class="day-content show-count-2">
                  <!---->
                  <li class="showing matinee show-1">
                    <span class="show-time">2p</span>
                    <span class="show-title">Cats</span>
                  </li>
                  <!---->
                  <li class="showing evening show-4">
                    <span class="show-time">8p</span>
                    <span class="show-title">Annie</span>
                  </li>
                </ul>
              </div>
            </li>
            <li class="day day-30 thursday">
              <div class="day-wrapper">
                <div class="day-identifiers">
                  <span class="day-name">
                    <span class="full">Thursday</span>
                    <span class="short">Thu</span>
                  </span>
                  <div class="month-holder">
                    <span class="month-name jul">Jul</span>
                  </div>
                  <span class="mday">30</span>
                </div>
                <ul class="day-content show-count-1">
                  <div class="spacer"></div>
                  <!---->
                  <li class="showing evening show-3">
                    <span class="show-time">8p</span>
                    <span class="show-title">Ladies</span>
                  </li>
                </ul>
              </div>
            </li>
            <li class="day day-31 friday">
              <div class="day-wrapper">
                <div class="day-identifiers">
                  <span class="day-name">
                    <span class="full">Friday</span>
                    <span class="short">Fri</span>
                  </span>
                  <div class="month-holder">
                    <span class="month-name jul">Jul</span>
                  </div>
                  <span class="mday">31</span>
                </div>
                <ul class="day-content show-count-2">
                  <!---->
                  <li class="showing matinee show-1">
                    <span class="show-time">2p</span>
                    <span class="show-title">Cats</span>
                  </li>
                  <!---->
                  <li class="showing evening show-2">
                    <span class="show-time">8p</span>
                    <span class="show-title">Yankees</span>
                  </li>
                </ul>
              </div>
            </li>
            <li class="day day-1 saturday">
              <div class="day-wrapper">
                <div class="day-identifiers">
                  <span class="day-name">
                    <span class="full">Saturday</span>
                    <span class="short">Sat</span>
                  </span>
                  <div class="month-holder">
                    <span class="month-name aug">Aug</span>
                  </div>
                  <span class="mday">1</span>
                </div>
                <ul class="day-content show-count-3">
                  <!---->
                  <li class="showing morning show-4">
                    <span class="show-time">10a</span>
                    <span class="show-title">Annie</span>
                  </li>
                  <!---->
                  <li class="showing matinee show-3">
                    <span class="show-time">2p</span>
                    <span class="show-title">Ladies</span>
                  </li>
                  <!---->
                  <li class="showing evening show-5">
                    <span class="show-time">8p</span>
                    <span class="show-title">Catch</span>
                  </li>
                </ul>
              </div>
            </li>
          </ul>
          <!-- week -->

          <ul class="week">
            <!---->
            <li class="day day-2 sunday">
              <div class="day-wrapper">
                <div class="day-identifiers">
                  <span class="day-name">
                    <span class="full">Sunday</span>
                    <span class="short">Sun</span>
                  </span>
                  <div class="month-holder">
                    <span class="month-name aug">Aug</span>
                  </div>
                  <span class="mday">2</span>
                </div>
                <ul class="day-content show-count-1">
                  <!---->
                  <li class="showing matinee show-1">
                    <span class="show-time">2p</span>
                    <span class="show-title">Cats</span>
                  </li>
                </ul>
              </div>
            </li>
            <li class="day dark day-3 monday">
              <div class="day-wrapper">
                <div class="day-identifiers">
                  <span class="day-name">
                    <span class="full">Monday</span>
                    <span class="short">Mon</span>
                  </span>
                  <div class="month-holder">
                    <span class="month-name aug">Aug</span>
                  </div>
                  <span class="mday">3</span>
                </div>
                <ul class="day-content show-count-0">
                  <!---->
                </ul>
              </div>
            </li>
            <li class="day day-4 tuesday">
              <div class="day-wrapper">
                <div class="day-identifiers">
                  <span class="day-name">
                    <span class="full">Tuesday</span>
                    <span class="short">Tue</span>
                  </span>
                  <div class="month-holder">
                    <span class="month-name aug">Aug</span>
                  </div>
                  <span class="mday">4</span>
                </div>
                <ul class="day-content show-count-1">
                  <div class="spacer"></div>
                  <li class="showing evening show-4">
                    <span class="show-time">8p</span>
                    <span class="show-title">Annie</span>
                  </li>
                </ul>
              </div>
            </li>
            <li class="day day-5 wednesday">
              <div class="day-wrapper">
                <div class="day-identifiers">
                  <span class="day-name">
                    <span class="full">Wednesday</span>
                    <span class="short">Wed</span>
                  </span>
                  <div class="month-holder">
                    <span class="month-name aug">Aug</span>
                  </div>
                  <span class="mday">5</span>
                </div>
                <ul class="day-content show-count-1">
                  <div class="spacer"></div>
                  <!---->
                  <li class="showing evening show-2">
                    <span class="show-time">8p</span>
                    <span class="show-title">Yankees</span>
                  </li>
                </ul>
              </div>
            </li>
            <li class="day day-6 thursday">
              <div class="day-wrapper">
                <div class="day-identifiers">
                  <span class="day-name">
                    <span class="full">Thursday</span>
                    <span class="short">Thu</span>
                  </span>
                  <div class="month-holder">
                    <span class="month-name aug">Aug</span>
                  </div>
                  <span class="mday">6</span>
                </div>
                <ul class="day-content show-count-2">
                  <!---->
                  <li class="showing matinee show-1">
                    <span class="show-time">2p</span>
                    <span class="show-title">Cats</span>
                  </li>
                  <!---->
                  <li class="showing evening show-5">
                    <span class="show-time">8p</span>
                    <span class="show-title">Catch</span>
                  </li>
                </ul>
              </div>
            </li>
            <li class="day day-7 friday">
              <div class="day-wrapper">
                <div class="day-identifiers">
                  <span class="day-name">
                    <span class="full">Friday</span>
                    <span class="short">Fri</span>
                  </span>
                  <div class="month-holder">
                    <span class="month-name aug">Aug</span>
                  </div>
                  <span class="mday">7</span>
                </div>
                <ul class="day-content show-count-2">
                  <!---->
                  <li class="showing matinee show-2">
                    <span class="show-time">2p</span>
                    <span class="show-title">Yankees</span>
                  </li>
                  <!---->
                  <li class="showing evening show-1">
                    <span class="show-time">8p</span>
                    <span class="show-title">Cats</span>
                  </li>
                </ul>
              </div>
            </li>
            <li class="day day-8 saturday">
              <div class="day-wrapper">
                <div class="day-identifiers">
                  <span class="day-name">
                    <span class="full">Saturday</span>
                    <span class="short">Sat</span>
                  </span>
                  <div class="month-holder">
                    <span class="month-name aug">Aug</span>
                  </div>
                  <span class="mday">8</span>
                </div>
                <ul class="day-content show-count-3">
                  <!---->
                  <li class="showing morning show-4">
                    <span class="show-time">10a</span>
                    <span class="show-title">Annie</span>
                  </li>
                  <!---->
                  <li class="showing matinee show-5">
                    <span class="show-time">2p</span>
                    <span class="show-title">Catch</span>
                  </li>
                  <!---->
                  <li class="showing evening show-3">
                    <span class="show-time">8p</span>
                    <span class="show-title">Ladies</span>
                  </li>
                </ul>
              </div>
            </li>
          </ul>
          <!-- week -->

          <ul class="week">
            <!---->
            <li class="day day-9 sunday">
              <div class="day-wrapper">
                <div class="day-identifiers">
                  <span class="day-name">
                    <span class="full">Sunday</span>
                    <span class="short">Sun</span>
                  </span>
                  <div class="month-holder">
                    <span class="month-name aug">Aug</span>
                  </div>
                  <span class="mday">9</span>
                </div>
                <ul class="day-content show-count-1">
                  <!---->
                  <li class="showing matinee show-2">
                    <span class="show-time">2p</span>
                    <span class="show-title">Yankees</span>
                  </li>
                </ul>
              </div>
            </li>
            <li class="day dark day-10 monday">
              <div class="day-wrapper">
                <div class="day-identifiers">
                  <span class="day-name">
                    <span class="full">Monday</span>
                    <span class="short">Mon</span>
                  </span>
                  <div class="month-holder">
                    <span class="month-name aug">Aug</span>
                  </div>
                  <span class="mday">10</span>
                </div>
                <ul class="day-content show-count-0">
                  <!---->
                </ul>
              </div>
            </li>
            <li class="day day-11 tuesday">
              <div class="day-wrapper">
                <div class="day-identifiers">
                  <span class="day-name">
                    <span class="full">Tuesday</span>
                    <span class="short">Tue</span>
                  </span>
                  <div class="month-holder">
                    <span class="month-name aug">Aug</span>
                  </div>
                  <span class="mday">11</span>
                </div>
                <ul class="day-content show-count-1">
                  <div class="spacer"></div>
                  <li class="showing evening show-1">
                    <span class="show-time">8p</span>
                    <span class="show-title">Cats</span>
                  </li>
                </ul>
              </div>
            </li>
            <li class="day day-12 wednesday">
              <div class="day-wrapper">
                <div class="day-identifiers">
                  <span class="day-name">
                    <span class="full">Wednesday</span>
                    <span class="short">Wed</span>
                  </span>
                  <div class="month-holder">
                    <span class="month-name aug">Aug</span>
                  </div>
                  <span class="mday">12</span>
                </div>
                <ul class="day-content show-count-2">
                  <!---->
                  <li class="showing matinee show-4">
                    <span class="show-time">2p</span>
                    <span class="show-title">Annie</span>
                  </li>
                  <!---->
                  <li class="showing evening show-5">
                    <span class="show-time">8p</span>
                    <span class="show-title">Catch</span>
                  </li>
                </ul>
              </div>
            </li>
            <li class="day day-13 thursday">
              <div class="day-wrapper">
                <div class="day-identifiers">
                  <span class="day-name">
                    <span class="full">Thursday</span>
                    <span class="short">Thu</span>
                  </span>
                  <div class="month-holder">
                    <span class="month-name aug">Aug</span>
                  </div>
                  <span class="mday">13</span>
                </div>
                <ul class="day-content show-count-2">
                  <!---->
                  <li class="showing matinee show-1">
                    <span class="show-time">2p</span>
                    <span class="show-title">Cats</span>
                  </li>
                  <!---->
                  <li class="showing evening show-2">
                    <span class="show-time">8p</span>
                    <span class="show-title">Yankees</span>
                  </li>
                </ul>
              </div>
            </li>
            <li class="day day-14 friday">
              <div class="day-wrapper">
                <div class="day-identifiers">
                  <span class="day-name">
                    <span class="full">Friday</span>
                    <span class="short">Fri</span>
                  </span>
                  <div class="month-holder">
                    <span class="month-name aug">Aug</span>
                  </div>
                  <span class="mday">14</span>
                </div>
                <ul class="day-content show-count-2">
                  <!---->
                  <li class="showing matinee show-3">
                    <span class="show-time">2p</span>
                    <span class="show-title">Ladies</span>
                  </li>
                  <!---->
                  <li class="showing evening show-5">
                    <span class="show-time">8p</span>
                    <span class="show-title">Catch</span>
                  </li>
                </ul>
              </div>
            </li>
            <li class="day day-15 saturday">
              <div class="day-wrapper">
                <div class="day-identifiers">
                  <span class="day-name">
                    <span class="full">Saturday</span>
                    <span class="short">Sat</span>
                  </span>
                  <div class="month-holder">
                    <span class="month-name aug">Aug</span>
                  </div>
                  <span class="mday">15</span>
                </div>
                <ul class="day-content show-count-2">
                  <!---->
                  <li class="showing matinee show-4">
                    <span class="show-time">2p</span>
                    <span class="show-title">Annie</span>
                  </li>
                  <!---->
                  <li class="showing evening show-3">
                    <span class="show-time">8p</span>
                    <span class="show-title">Ladies</span>
                  </li>
                </ul>
              </div>
            </li>
          </ul>
          <!-- week -->

          <ul class="week">
            <!---->
            <li class="day day-16 sunday">
              <div class="day-wrapper">
                <div class="day-identifiers">
                  <span class="day-name">
                    <span class="full">Sunday</span>
                    <span class="short">Sun</span>
                  </span>
                  <div class="month-holder">
                    <span class="month-name aug">Aug</span>
                  </div>
                  <span class="mday">16</span>
                </div>
                <ul class="day-content show-count-1">
                  <!---->
                  <li class="showing matinee show-1">
                    <span class="show-time">2p</span>
                    <span class="show-title">Cats</span>
                  </li>
                </ul>
              </div>
            </li>
          </ul>
          <!-- week -->
        </div>
      </div>
    </div>
  </div>
</div>
