import { defineProperty } from '@ember/object';
import { filter } from '@ember/object/computed';
import Helper from '@ember/component/helper';
import { get } from '@ember/object';
import { observer } from '@ember/object';
import { set } from '@ember/object';
import { isEmpty } from '@ember/utils';
import isEqual from '../utils/is-equal';

export default Helper.extend({
  compute([searchScopes, array, doNotRender, didFinishSearch]) {
    set(this, 'array', array);
    set(this, 'didFinishSearch', didFinishSearch);
    set(this, 'doNotRender', doNotRender);
    set(this, 'searchScopes', searchScopes);
    return get(this, 'content');
  },

  byPathDidChange: observer('searchScopes', function() {
    let searchScopes = this.get('searchScopes');
    if (isEmpty(searchScopes)) {
      defineProperty(this, 'content', []);
      return;
    }
    let searchScopesObjects = get(this, 'searchScopes').map((item) => {
      let searchScope = item.split(':');
      return { searchProp: searchScope[0], searchMethod: searchScope[1], searchValue: searchScope[2] };
    });
    let filterFunctions = [];
    searchScopesObjects.forEach((element) => {
      let filterFn;
      let value = element.searchValue;
      let method = element.searchMethod;
      let byPath = element.searchProp;
      switch (method) {
        case 'isGreaterThan':
          filterFn = ((item) => item[byPath] > value);
          break;
        case 'isLessThan':
          filterFn = ((item) => item[byPath] < value);
          break;
        case 'equals':
          filterFn = (item) => isEqual(get(item, byPath), value);
          break;
        case 'doesNotEquals':
          filterFn = ((item) => item[byPath] != value);
          break;
        case 'exists':
          if (value) {
            filterFn = (item) => !!get(item, byPath);
          } else {
            filterFn = (item) => !get(item, byPath);
          }
          break;
        case 'contains':
          filterFn = ((item) => item[byPath].toString().search(new RegExp(value.toString(), 'i')) != -1);
          break;
        default:
          filterFn = (item) => isEqual(get(item, byPath), value);
          break;
      }
      filterFunctions.push(filterFn);
    });

    let complexFilterFunction = function(item) {
      let filterResults = filterFunctions.map((currentFilter) => currentFilter(item));
      return filterResults.every((item) => item === true);
    };
    let cp = filter('array.@each', complexFilterFunction);
    defineProperty(this, 'content', cp);
    let didFinishSearch = this.get('didFinishSearch');
    if (didFinishSearch) {
      didFinishSearch(get(this, 'content'));
    }
    let doNotRender = this.get('doNotRender');
    if (doNotRender) {
      cp = filter('array.@each', (() => false));
      defineProperty(this, 'content', cp);
    }
  }),

  contentDidChange: observer('content', function() {
    this.recompute();
  })
});
