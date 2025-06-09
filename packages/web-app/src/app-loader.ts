import useAppStore from './stores/app.ts';

const appLoader = (async function (){
 const store =  useAppStore.getState();
  if(store.initialized) {
    return store
  }
  return store.initialize()
})()

export default appLoader;