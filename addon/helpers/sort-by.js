import { defineProperty } from '@ember/object';
import { isArray as isEmberArray } from '@ember/array';
import { sort } from '@ember/object/computed';
import Helper from '@ember/component/helper';
import { get } from '@ember/object';
import { observer } from '@ember/object';
import { set } from '@ember/object';
import { isEmpty, typeOf } from '@ember/utils';
import { filter } from '@ember/object/computed';

export default Helper.extend({
  compute([sortProps, array, doNotRender, didFinishSort]) {
    let [firstSortProp] = sortProps;

    if (typeOf(firstSortProp) === 'function' || isEmberArray(firstSortProp)) {
      sortProps = firstSortProp;
    }

    set(this, 'array', array);
    set(this, 'didFinishSort', didFinishSort);
    set(this, 'doNotRender', doNotRender);
    set(this, 'sortProps', sortProps);

    return get(this, 'content');
  },

  sortPropsDidChange: observer('sortProps', function() {
    let sortProps = get(this, 'sortProps');

    if (isEmpty(sortProps)) {
      defineProperty(this, 'content', []);
    }

    if (typeof sortProps === 'function') {
      defineProperty(this, 'content', sort('array', sortProps));
    } else {
      defineProperty(this, 'content', sort('array', 'sortProps'));
    }
    let didFinishSort = this.get('didFinishSort');
    if (didFinishSort) {
      didFinishSort(get(this, 'content'));
    }
    let doNotRender = this.get('doNotRender');
    if (doNotRender) {
      let cp = filter('array.@each', (() => false));
      defineProperty(this, 'content', cp);
    }
  }),

  contentDidChange: observer('content', function() {
    this.recompute();
  })
});
