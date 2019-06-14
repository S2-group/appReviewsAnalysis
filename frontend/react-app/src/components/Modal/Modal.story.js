import React from 'react';
import { storiesOf, action, linkTo, configure, setAddon } from '@kadira/storybook';
import infoAddon from '@kadira/react-storybook-addon-info';

import Modal from './Modal.js';

import template from './Modal.less'; 
import Widget from '../../../stories/Widget.js';

setAddon(infoAddon);

function handleShow(that){
    //that.refs.modal.show();
    document.getElementById('modaldialog').show();
}

const Test = React.createClass({
    handleShow(){
        this.refs.modal.show();
    },
    render:function(){
        return(
            <div>
            <Modal ref="modal" title="Modal" okCancel={true} handleOkClick={action('Clicked OK')}>
                <p>
                    Sator arepo tenet opera rotas.
                </p>
            </Modal>
            <button onClick={this.handleShow}>show</button>
            </div>
        );
    }
});

storiesOf('Modal', module)
  .addWithInfo(
    'Modal',
    `
      A generic modal dialog.
    `,
     () => (
     <div>
      <Widget skin={'bg_light_a'} width={2} height={2}>
        <Test/>
        
      </Widget>
      
    </div>  
    
  ))