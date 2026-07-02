/**
 * Help modal — open / close with topic-based content.
 *
 * Ported from monolithic app.js (lines 1212-1275).
 * Standalone — no state imports.
 */

export function openHelp(topic) {
  const body = document.getElementById('helpModalBody');
  const title = document.getElementById('helpModalTitle');

  if (topic === 'filter') {
    title.textContent = 'Search \u2014 How to Filter the Tree';
    body.innerHTML =
      '<p>Type any text to <strong>hide nodes</strong> whose keys and values don\'t contain it. The tree shows only branches that have a match somewhere in their subtree.</p>' +
      '<h4>Examples</h4>' +
      '<div class="help-example"><code>weight</code><span>Show all nodes that mention "weight" (key or value)</span></div>' +
      '<div class="help-example"><code>IP</code><span>Show only IP-segment related nodes</span></div>' +
      '<div class="help-example"><code>segmentType</code><span>Show segment type fields</span></div>' +
      '<div class="help-example"><code>800</code><span>Show nodes with value 800</span></div>' +
      '<p class="help-tip">The filter updates as you type. Press <kbd>Escape</kbd> to clear.</p>';
  } else if (topic === 'skip') {
    title.textContent =
      'Skip Fields \u2014 Ignore Differences in Specific Fields';
    body.innerHTML =
      '<p>Type field names separated by commas to <strong>exclude them from the diff</strong>. Excluded fields still appear in the tree but are marked as "same" and don\'t count toward change totals or navigation.</p>' +
      '<h4>Examples</h4>' +
      '<div class="help-example"><code>id</code><span>Ignore the <code>id</code> field everywhere</span></div>' +
      '<div class="help-example"><code>id, $type</code><span>Ignore multiple fields</span></div>' +
      '<div class="help-example"><code>*_ID</code><span>Wildcard \u2014 any field ending in <code>_ID</code></span></div>' +
      '<div class="help-example"><code>createdDate, modifiedDate</code><span>Ignore timestamp fields</span></div>' +
      '<div class="help-example"><code>id, $type, createdOn, modifiedOn, ownerId</code><span>Common volatile fields for AHU models</span></div>' +
      '<h4>Tips</h4>' +
      '<ul class="help-notes">' +
      '<li>The input updates automatically 300ms after you stop typing</li>' +
      '<li>Press <kbd>Escape</kbd> to clear and reset</li>' +
      '<li>Your skip list is <strong>saved automatically</strong> in localStorage \u2014 it persists across reloads</li>' +
      '</ul>';
  } else {
    title.textContent = 'JMESPath \u2014 Query, Filter & Map';
    body.innerHTML =
      '<p>JMESPath is a query language for JSON, similar to <strong>JavaScript\'s .map() + .filter()</strong>. Write an expression and it runs against both datasets, showing a preview and a diff table.</p>' +
      '<h4>Get a field from every segment (like .map())</h4>' +
      '<div class="help-example"><code>unit.segmentList[*].segmentType</code><span>All segment types as a flat array</span></div>' +
      '<div class="help-example"><code>unit.segmentList[*].weight</code><span>All weights as a flat array</span></div>' +
      '<h4>Reshape objects (like .map() returning objects)</h4>' +
      '<div class="help-example"><code>unit.segmentList[*].{segmentType: segmentType, coreLength: coreLength,geometry: geometry}</code><span>New objects with only segmentType, coreLength, geometry</span></div>' +
      '<div class="help-example"><code>unit.segmentList[*].{segId: segmentIP_ID, x: geometry.x, y: geometry.y}</code><span>Coordinates + ID from nested objects</span></div>' +
      '<div class="help-example"><code>unit.segmentList[*].[segmentType, weight]</code><span>Array of pairs like [["IP",858], ...]</span></div>' +
      '<h4>Filter items (like .filter())</h4>' +
      '<div class="help-example"><code>unit.segmentList[?weight &gt; `800`]</code><span>Segments with weight over 800</span></div>' +
      '<div class="help-example"><code>unit.segmentList[?segmentType == `IP`]</code><span>Only IP-type segments</span></div>' +
      '<h4>Filter + reshape together</h4>' +
      '<div class="help-example"><code>unit.segmentList[?weight &gt; `800`].{type: segmentType, weight: weight}</code><span>Filter then map in one expression</span></div>' +
      '<h4>Other useful examples</h4>' +
      '<div class="help-example"><code>unit.segmentList[*].segmentType | sort(@)</code><span>Sorted unique types</span></div>' +
      '<div class="help-example"><code>unit.id</code><span>Simple scalar field</span></div>' +
      '<div class="help-example"><code>unit.segmentList[0]</code><span>First segment (full object)</span></div>' +
      '<h4>Syntax notes</h4>' +
      '<ul class="help-notes">' +
      '<li><code>[*]</code> means "iterate over all items in the array"</li>' +
      '<li><code>[?condition]</code> means "filter items where condition is true"</li>' +
      '<li>Use <strong>backticks</strong> for literal values: <code>`800`</code>, <code>`IP`</code>, <code>`true`</code></li>' +
      '<li>The query always starts from the <strong>root</strong> of the JSON, so paths begin with <code>unit.</code></li>' +
      '<li>Press <kbd>Enter</kbd> or click <strong>Query</strong> to execute</li>' +
      '</ul>';
  }
  document.getElementById('helpOverlay').classList.add('open');
}

export function closeHelp() {
  document.getElementById('helpOverlay').classList.remove('open');
}
