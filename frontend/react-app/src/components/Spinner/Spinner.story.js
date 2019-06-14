import React from 'react';
import { storiesOf, action, linkTo, configure, setAddon } from '@kadira/storybook';
import infoAddon from '@kadira/react-storybook-addon-info';

import Spinner from './Spinner.js';
import Widget from '../../../stories/Widget.js';

setAddon(infoAddon);

storiesOf('Spinner', module)
  .addWithInfo(
    'Static control',
    `
      Spinner has no parameters.
    `,
     () => (
     <div>
      <Widget skin={'bg_light_a'} width={2} height={2}>
       <Spinner/>
      </Widget>
		<Widget skin={'bg_dark_a'} width={2} height={2}>
       <Spinner/>
      </Widget>
    </div>  
    
  ));