import { ModuleVersion } from '../'
import { ModuleStateData, ModuleConfigData, Module, ModuleMap } from './common'

export interface VTubeStudioStateData extends ModuleStateData {

}

export interface VTubeStudioConfigData extends ModuleConfigData {

}

export const VTubeStudioModule: Module<VTubeStudioStateData, VTubeStudioConfigData> = {
    name: 'VOD Queue',
    description: 'Allows channel point redemptions to trigger effects in VTube Studio.',
    version: ModuleVersion.preAlpha,
    getData: (modules: ModuleMap) => modules.vtubeStudio,
}
