<template>
  <div class="detail-page">
    <!-- 固定顶栏 -->
    <div class="detail-header">
      <div class="detail-header-left">
        <a-button type="text" class="back-btn" @click="emit('back')">
          <template #icon><LeftOutlined /></template>
        </a-button>
        <a-tooltip :title="props.editId ? `编辑完工申请-${detail.projectName}` : `完工申请-${detail.projectName}`">
          <span class="detail-title">{{ props.editId ? `编辑完工申请-${detail.projectName}` : `完工申请-${detail.projectName}` }}</span>
        </a-tooltip>
        <span class="node-dot-tag"><span class="node-dot-tag__dot" style="background:#13c2c2"></span>完工</span>
        <a-tag :color="STATUS_COLOR[detail.filingStatus]">
          {{ STATUS_LABEL[detail.filingStatus] }}
        </a-tag>
        <span class="detail-header-meta">
          <span class="detail-header-meta-item">{{ detail.stationType }}</span>
          <span class="detail-header-meta-divider" />
          <span class="detail-header-meta-item">{{ props.policyType === 'nonstandard' ? PROJECT_TYPE_LABEL[detail.projectType] : '公建 EMC' }}</span>
          <span class="detail-header-meta-divider" />
          <span class="detail-header-meta-item">{{ props.initData?.policyType === 'nonstandard' ? '非标政策' : '标准政策' }}</span>
          <span class="detail-header-meta-divider" />
          <span class="detail-header-meta-item">{{ detail.stationNo }}<CopyOutlined class="copy-icon" @click="copyStationNo(detail.stationNo)" /></span>
        </span>
      </div>
      <a-space>
        <a-button @click="emit('back')">取消</a-button>
        <a-button :loading="saving" @click="handleSave">保存</a-button>
        <a-button type="primary" :loading="submitting" @click="handleSubmit">提交完工申请</a-button>
      </a-space>
    </div>

    <div ref="detailBodyRef" class="detail-body" :style="scrollPad > 0 ? { paddingBottom: scrollPad + 'px' } : {}">
      <div class="detail-main">

        <!-- 退回原因卡片（仅完工审核不通过时展示） -->
        <RejectCard v-if="detail.filingStatus === 'complete_rejected'" :info="rejectInfo" :title="STATUS_LABEL[detail.filingStatus]" />

        <!-- ── 项目信息 ── -->
        <div class="detail-card detail-card--plain">
          <div class="section-title section-title--toggle" :class="{ 'section-title--collapsed': !projectInfoOpen }" @click="projectInfoOpen = !projectInfoOpen">项目信息<DownOutlined class="section-toggle-icon" :class="{ rotated: projectInfoOpen }" /></div>
          <div v-show="projectInfoOpen">

          <!-- 标准政策布局 -->
          <template v-if="props.policyType !== 'nonstandard'">
            <div class="info-section" style="margin-top:0">
              <div class="info-section-title">基本信息</div>
              <div class="info-grid">
                <div class="info-item"><span class="info-label">电站类型</span><span class="info-value">{{ detail.stationType }}</span></div>
                <div class="info-item"><span class="info-label">项目名称</span><span class="info-value">{{ detail.projectName }}</span></div>
                <div class="info-item"><span class="info-label">项目类型</span><span class="info-value">{{ '公建 EMC' }}</span></div>
                <div class="info-item"><span class="info-label">匹配政策</span><span class="info-value">标准政策</span></div>
                <div class="info-item"><span class="info-label">所属区域公司</span><span class="info-value">{{ detail.regionCompany }}</span></div>
                <div class="info-item"><span class="info-label">项目地址</span><span class="info-value">{{ detail.region.join(' / ') }}</span></div>
                <div class="info-item"><span class="info-label">详细地址</span><span class="info-value">{{ detail.addressDetail }}</span></div>
                <div class="info-item"><span class="info-label">项目容量</span><span class="info-value">{{ detail.capacity }} kW</span></div>
                <div class="info-item"><span class="info-label">并网电压等级</span><span class="info-value">{{ GRID_VOLTAGE_LABEL[detail.gridVoltage] }}</span></div>
                <div class="info-item"><span class="info-label">代理商名称</span><span class="info-value">{{ detail.agentName }}</span></div>
                <div class="info-item"><span class="info-label">用电企业名称</span><span class="info-value">{{ detail.userEntName }}</span></div>
              </div>
            </div>
            <div class="info-section">
              <div class="info-section-title">供应商信息</div>
              <div class="info-grid">
                <div class="info-item"><span class="info-label">开发商名称</span><span class="info-value">{{ detail.developerName || '—' }}</span></div>
                <div class="info-item"><span class="info-label">施工商名称</span><span class="info-value">{{ detail.constructorName || '—' }}</span></div>
                <div class="info-item"><span class="info-label">监理商名称</span><span class="info-value">{{ detail.supervisorName || '—' }}</span></div>
                <div class="info-item"><span class="info-label">设计商名称</span><span class="info-value">{{ detail.designerName || '—' }}</span></div>
              </div>
            </div>
            <div class="info-section">
              <div class="info-section-title">合同信息</div>
              <div class="info-grid">
                <div class="info-item"><span class="info-label">EMC 电价</span><span class="info-value">{{ detail.emcPrice }} 元/kWh</span></div>
                <div class="info-item"><span class="info-label">EMC 年限</span><span class="info-value">{{ detail.emcYears }} 年</span></div>
                <div class="info-item"><span class="info-label">消纳比例</span><span class="info-value">{{ detail.consumptionRate }}%</span></div>
                <div v-if="detail.projectType === 'public_emc'" class="info-item"><span class="info-label">公建机构类型</span><span class="info-value">{{ PUBLIC_BUILD_TYPE_LABEL[detail.publicBuildType] || '—' }}</span></div>
              </div>
            </div>
            <div class="info-section" style="border-top: none; padding-top: 0">
              <div class="info-grid">
                <div class="info-item info-item--span2"><span class="info-label">产权证明</span><span class="info-value"><FileAttachmentView v-if="detail.propertyProof?.length" :files="detail.propertyProof" /><span v-else>—</span></span></div>
                <div class="info-item info-item--span2"><span class="info-label">营业执照/组织机构代码证</span><span class="info-value"><FileAttachmentView v-if="detail.bizLicense?.length" :files="detail.bizLicense" /><span v-else>—</span></span></div>
                <div class="info-item info-item--span2"><span class="info-label">开户许可证</span><span class="info-value"><FileAttachmentView v-if="detail.bankAccountCert" :files="[detail.bankAccountCert]" /><span v-else>—</span></span></div>
                <div class="info-item" style="grid-column-start:1"><span class="info-label">法定代表人身份证正面</span><div class="id-card-img id-card-img--front" v-if="detail.idCardFront" /><span v-else>—</span></div>
                <div class="info-item"><span class="info-label">法定代表人身份证反面</span><div class="id-card-img id-card-img--back" v-if="detail.idCardBack" /><span v-else>—</span></div>
              </div>
            </div>
            <div class="info-section">
              <div class="info-section-title">项目产权信息</div>
              <div class="info-grid">
                <div class="info-item"><span class="info-label">项目公司</span><span class="info-value">{{ detail.projectCompany || '—' }}</span></div>
                <div class="info-item"><span class="info-label">EPC 公司</span><span class="info-value">{{ detail.epcCompany || '—' }}</span></div>
                <div class="info-item"><span class="info-label">产权公司</span><span class="info-value">{{ detail.ownershipCompany || '—' }}</span></div>
              </div>
            </div>
          </template>

          <!-- 非标政策布局 -->
          <template v-else>
            <div class="info-section" style="margin-top:0">
              <div class="info-grid">
                <div class="info-item"><span class="info-label">OA编号</span><span class="info-value">{{ detail.oaNo || '—' }}</span></div>
                <div class="info-item"><span class="info-label">项目名称</span><span class="info-value">{{ detail.projectName }}</span></div>
                <div class="info-item"><span class="info-label">项目类型</span><span class="info-value">{{ PROJECT_TYPE_LABEL[detail.projectType] }}</span></div>
                <div class="info-item"><span class="info-label">是否政策匹配</span><span class="info-value">否</span></div>
                <div class="info-item"><span class="info-label">省市区</span><span class="info-value">{{ detail.region?.join(' / ') || '—' }}</span></div>
                <div class="info-item info-item--span2"><span class="info-label">详细地址</span><span class="info-value">{{ detail.addressDetail || '—' }}</span></div>
                <div class="info-item"><span class="info-label">EMC 年限</span><span class="info-value">{{ detail.emcYears }} 年</span></div>
                <div class="info-item"><span class="info-label">项目容量</span><span class="info-value">{{ detail.capacity }} kW</span></div>
                <div class="info-item"><span class="info-label">并网电压等级</span><span class="info-value">{{ GRID_VOLTAGE_LABEL[detail.gridVoltage] }}</span></div>
                <div class="info-item"><span class="info-label">代理商名称</span><span class="info-value">{{ detail.agentName }}</span></div>
                <div class="info-item"><span class="info-label">用电企业名称</span><span class="info-value">{{ detail.userEntName }}</span></div>
                <div class="info-item"><span class="info-label">开发商名称</span><span class="info-value">{{ detail.developerName || '—' }}</span></div>
                <div class="info-item"><span class="info-label">施工商名称</span><span class="info-value">{{ detail.constructorName || '—' }}</span></div>
                <div class="info-item"><span class="info-label">EMC 电价</span><span class="info-value">{{ detail.emcPrice }} 元/kWh</span></div>
                <div class="info-item"><span class="info-label">消纳比例</span><span class="info-value">{{ detail.consumptionRate }}%</span></div>
                <div class="info-item info-item--span2" style="grid-column-start:1"><span class="info-label">产权证明</span><span class="info-value"><FileAttachmentView v-if="detail.propertyProof?.length" :files="detail.propertyProof" /><span v-else>—</span></span></div>
              </div>
            </div>
          </template>
          </div>
        </div>


        <div ref="tabsWrapperRef" class="tabs-wrapper" :class="{ 'tabs-stuck': tabsStuck }">
          <a-tabs
            v-model:active-key="activeTab"
            class="detail-tabs"
            :tab-bar-style="{ padding: tabsStuck ? '0 24px' : '8px 24px 0', marginBottom: 0 }"
            @tab-click="scrollToTabNav"
          >
            <!-- ──────── 勘察 TAB ──────── -->
            <a-tab-pane key="survey" tab="勘察">
              <div class="tab-body">
                <div class="info-section" style="margin-top:0">
                  <div class="info-section-title">项目总体概况</div>
                  <div class="info-grid">
                    <div class="info-item"><span class="info-label">建筑数量</span><span class="info-value">{{ detail.buildingCount != null ? detail.buildingCount + ' 个' : '—' }}</span></div>
                    <div class="info-item info-item--span2">
                      <span class="info-label">屋面类型</span>
                      <span class="info-value">
                        <template v-if="detail.roofLightSteel || detail.roofConcrete || detail.roofOther">
                          <span v-if="detail.roofLightSteel">轻钢结构屋面 {{ detail.roofLightSteel }} 个</span>
                          <span v-if="detail.roofLightSteel && detail.roofConcrete">　</span>
                          <span v-if="detail.roofConcrete">混凝土屋面 {{ detail.roofConcrete }} 个</span>
                          <span v-if="(detail.roofLightSteel || detail.roofConcrete) && detail.roofOther">　</span>
                          <span v-if="detail.roofOther">其他 {{ detail.roofOther }} 个</span>
                        </template>
                        <template v-else>—</template>
                      </span>
                    </div>
                    <div class="info-item info-item--span2"><span class="info-label">总平面布置图</span><span class="info-value"><FileAttachmentView v-if="detail.siteLayoutFiles?.length" :files="detail.siteLayoutFiles" /><span v-else>—</span></span></div>
                  </div>
                </div>
                <div class="info-section">
                  <div class="info-section-title">每个建筑的屋面情况</div>
                  <div class="info-grid">
                    <div class="info-item"><span class="info-label">彩钢瓦瓦型</span><span class="info-value">{{ STEEL_ROOF_LABEL[detail.steelRoofType] || '—' }}</span></div>
                    <div class="info-item"><span class="info-label">瓦面锈蚀情况</span><span class="info-value">{{ RUST_LABEL[detail.rustCondition] || '—' }}</span></div>
                    <div class="info-item">
                      <span class="info-label">屋面是否有障碍物</span>
                      <span class="info-value">
                        <template v-if="detail.hasObstacle === 'yes'">有，高 {{ detail.obstacleHeight }}m / 宽 {{ detail.obstacleWidth }}m</template>
                        <template v-else-if="detail.hasObstacle === 'no'">无</template>
                        <template v-else>—</template>
                      </span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">屋面是否有采光带</span>
                      <span class="info-value">
                        <template v-if="detail.hasSkylight === 'yes'">有，采光带宽度 {{ detail.skylightWidth }}mm</template>
                        <template v-else-if="detail.hasSkylight === 'no'">无</template>
                        <template v-else>—</template>
                      </span>
                    </div>
                  </div>
                </div>
                <div class="info-section">
                  <div class="info-section-title">用户配电情况</div>
                  <div class="info-grid">
                    <div class="info-item"><span class="info-label">进线电压等级</span><span class="info-value">{{ detail.inletVoltage != null ? detail.inletVoltage + ' kV' : '—' }}</span></div>
                    <div class="info-item"><span class="info-label">用户进线接入方式</span><span class="info-value">{{ INLET_CONN_LABEL[detail.inletConnectionType] || '—' }}</span></div>
                    <div class="info-item"><span class="info-label">进线回路数</span><span class="info-value">{{ detail.circuitCount != null ? detail.circuitCount + ' 回' : '—' }}</span></div>
                    <div class="info-item"><span class="info-label">进线电缆规格</span><span class="info-value">{{ detail.cableSpec != null ? detail.cableSpec + ' mm²' : '—' }}</span></div>
                    <div class="info-item"><span class="info-label">用户变压器</span><span class="info-value">{{ detail.transformerCount != null ? detail.transformerCount + ' 台，共 ' + detail.transformerKVA + ' kVA' : '—' }}</span></div>
                    <div class="info-item info-item--span2"><span class="info-label">是否具备接入间隔</span><span class="info-value">{{ INTERVAL_LABEL[detail.hasInterval] || '—' }}</span></div>
                  </div>
                </div>
                <div class="info-section">
                  <div class="info-section-title">勘察照片</div>
                  <a-row :gutter="[24, 16]">
                    <a-col v-for="cat in PHOTO_CATEGORIES" :key="cat.key" :span="12">
                      <div class="photo-readonly-col">
                        <span class="photo-readonly-label">{{ cat.label }}</span>
                        <div class="photo-readonly-imgs">
                          <template v-if="detail.photos[cat.key]?.length">
                            <a-image v-for="(img, i) in detail.photos[cat.key]" :key="i" :src="img" :width="80" :height="80" style="object-fit:cover;border-radius:4px" />
                          </template>
                          <span v-else class="empty-hint">—</span>
                        </div>
                      </div>
                    </a-col>
                  </a-row>
                </div>
                <div class="info-section">
                  <div class="info-section-title">项目图纸及用电情况</div>
                  <div class="info-grid">
                    <div class="info-item info-item--span2"><span class="info-label">图纸</span><span class="info-value"><FileAttachmentView v-if="detail.drawingFiles?.length" :files="detail.drawingFiles" /><span v-else>—</span></span></div>
                    <div class="info-item info-item--span2"><span class="info-label">用电情况</span><span class="info-value"><FileAttachmentView v-if="detail.electricityFiles?.length" :files="detail.electricityFiles" /><span v-else>—</span></span></div>
                  </div>
                </div>
                <div class="info-section">
                  <div class="info-section-title">接入批复</div>
                  <div class="info-grid">
                    <div class="info-item info-item--span2"><span class="info-label">接入批复</span><span class="info-value"><FileAttachmentView v-if="detail.approvalFiles?.length" :files="detail.approvalFiles" /><span v-else>—</span></span></div>
                  </div>
                </div>
              </div>
            </a-tab-pane>

            <!-- ──────── 设计 TAB ──────── -->
            <a-tab-pane key="design" tab="设计">
              <div class="tab-body tab-body--design">
                <div class="info-section" style="margin-top:0">
                  <div class="info-section-title">甲供 BOM</div>
                  <a-table :columns="jiagongReadonlyColumns" :data-source="detail.jiagongBom" :pagination="false" size="small" :locale="{ emptyText: '暂无甲供物料' }" />
                </div>
                <div class="info-section">
                  <div class="info-section-title">乙供中高/低压 BOM</div>
                  <a-table :columns="yigongReadonlyColumns" :data-source="detail.yigongBom" :pagination="false" size="small" :locale="{ emptyText: '暂无乙供中/低压物料' }" />
                </div>
                <div class="info-section">
                  <div class="info-section-title">上网模式</div>
                  <div class="info-grid">
                    <div class="info-item"><span class="info-label">上网模式</span><span class="info-value">{{ GRID_MODE_LABEL[detail.gridMode] || '—' }}</span></div>
                  </div>
                </div>
                <div class="info-section">
                  <div class="info-section-title" style="margin-bottom:8px">应用场景</div>
                  <div style="font-size:14px;color:rgba(0,0,0,0.65);margin-bottom:12px">应用场景是否混装：{{ detail.scenes.length > 1 ? '是' : '否' }}</div>
                  <a-table :columns="sceneColumns" :data-source="detail.scenes" :pagination="false" size="small" />
                </div>
                <div class="info-section">
                  <div class="info-section-title">设计附件</div>
                  <div class="info-grid">
                    <div class="info-item info-item--span2"><span class="info-label">设计资质</span><span class="info-value"><FileAttachmentView v-if="detail.designQualFiles?.length" :files="detail.designQualFiles" /><span v-else>—</span></span></div>
                    <div class="info-item info-item--span2"><span class="info-label">电气设计图</span><span class="info-value"><FileAttachmentView v-if="detail.electricalDesignFiles?.length" :files="detail.electricalDesignFiles" /><span v-else>—</span></span></div>
                    <div class="info-item info-item--span2"><span class="info-label">结构设计图</span><span class="info-value"><FileAttachmentView v-if="detail.structuralDesignFiles?.length" :files="detail.structuralDesignFiles" /><span v-else>—</span></span></div>
                    <div class="info-item info-item--span2"><span class="info-label">厂房结构安全性评估</span><span class="info-value"><FileAttachmentView v-if="detail.safetyAssessFiles?.length" :files="detail.safetyAssessFiles" /><span v-else>—</span></span></div>
                    <div class="info-item info-item--span2"><span class="info-label">其他附件</span><span class="info-value"><FileAttachmentView v-if="detail.otherAttachFiles?.length" :files="detail.otherAttachFiles" /><span v-else>—</span></span></div>
                  </div>
                </div>
              </div>
            </a-tab-pane>

            <!-- ──────── 商务 TAB ──────── -->
            <a-tab-pane key="commercial" tab="商务">
              <div class="tab-body tab-body--commercial">
                <div class="info-section" style="margin-top:0">
                  <div class="info-section-title">合同信息</div>
                  <div class="contract-block-ro">
                    <div class="contract-block-ro-header">EMC协议（能源管理合同）</div>
                    <div class="info-grid">
                      <div class="info-item"><span class="info-label">合同编号</span><span class="info-value">{{ detail.commercial.emcContract.contractNo || '—' }}</span></div>
                      <div class="info-item"><span class="info-label">合同款项类别</span><span class="info-value">{{ detail.commercial.emcContract.paymentCategory || '—' }}</span></div>
                      <div class="info-item"><span class="info-label">甲方</span><span class="info-value">{{ detail.commercial.emcContract.partyA || '—' }}</span></div>
                      <div class="info-item"><span class="info-label">乙方</span><span class="info-value">{{ detail.commercial.emcContract.partyB || '—' }}</span></div>
                      <div class="info-item"><span class="info-label">合同签订金额</span><span class="info-value">{{ detail.commercial.emcContract.amount != null ? detail.commercial.emcContract.amount + ' 元' : '—' }}</span></div>
                      <div class="info-item"><span class="info-label">合同签订日期</span><span class="info-value">{{ detail.commercial.emcContract.signDate || '—' }}</span></div>
                      <div class="info-item"><span class="info-label">备注</span><span class="info-value">{{ detail.commercial.emcContract.remark || '—' }}</span></div>
                      <div class="info-item info-item--span2"><span class="info-label">合同附件</span><span class="info-value"><FileAttachmentView v-if="detail.commercial.emcContract.files?.length" :files="detail.commercial.emcContract.files" /><span v-else>—</span></span></div>
                    </div>
                  </div>
                  <div class="contract-block-ro">
                    <div class="contract-block-ro-header">小E施工承包合同（常规EMC）</div>
                    <div class="info-grid">
                      <div class="info-item"><span class="info-label">合同编号</span><span class="info-value">{{ detail.commercial.smallEContract.contractNo || '—' }}</span></div>
                      <div class="info-item"><span class="info-label">合同款项类别</span><span class="info-value">{{ detail.commercial.smallEContract.paymentCategory || '—' }}</span></div>
                      <div class="info-item"><span class="info-label">甲方</span><span class="info-value">{{ detail.commercial.smallEContract.partyA || '—' }}</span></div>
                      <div class="info-item"><span class="info-label">乙方</span><span class="info-value">{{ detail.commercial.smallEContract.partyB || '—' }}</span></div>
                      <div class="info-item"><span class="info-label">合同签订金额</span><span class="info-value">{{ detail.commercial.smallEContract.amount != null ? detail.commercial.smallEContract.amount + ' 元' : '—' }}</span></div>
                      <div class="info-item"><span class="info-label">合同签订日期</span><span class="info-value">{{ detail.commercial.smallEContract.signDate || '—' }}</span></div>
                      <div class="info-item"><span class="info-label">实控人姓名</span><span class="info-value">{{ detail.commercial.smallEContract.controllerName || '—' }}</span></div>
                      <div class="info-item info-item--span2"><span class="info-label">合同附件</span><span class="info-value"><FileAttachmentView v-if="detail.commercial.smallEContract.files?.length" :files="detail.commercial.smallEContract.files" /><span v-else>—</span></span></div>
                    </div>
                  </div>
                  <div class="contract-block-ro">
                    <div class="contract-block-ro-header">设计合同</div>
                    <div class="info-grid">
                      <div class="info-item"><span class="info-label">合同编号</span><span class="info-value">{{ detail.commercial.designContract.contractNo || '—' }}</span></div>
                      <div class="info-item"><span class="info-label">甲方</span><span class="info-value">{{ detail.commercial.designContract.partyA || '—' }}</span></div>
                      <div class="info-item"><span class="info-label">乙方</span><span class="info-value">{{ detail.commercial.designContract.partyB || '—' }}</span></div>
                      <div class="info-item"><span class="info-label">合同签订金额</span><span class="info-value">{{ detail.commercial.designContract.amount != null ? detail.commercial.designContract.amount + ' 元' : '—' }}</span></div>
                    </div>
                  </div>
                  <div class="contract-block-ro">
                    <div class="contract-block-ro-header">监理合同</div>
                    <div class="info-grid">
                      <div class="info-item"><span class="info-label">合同编号</span><span class="info-value">{{ detail.commercial.jianliContract.contractNo || '—' }}</span></div>
                      <div class="info-item"><span class="info-label">甲方</span><span class="info-value">{{ detail.commercial.jianliContract.partyA || '—' }}</span></div>
                      <div class="info-item"><span class="info-label">乙方</span><span class="info-value">{{ detail.commercial.jianliContract.partyB || '—' }}</span></div>
                      <div class="info-item"><span class="info-label">合同签订金额</span><span class="info-value">{{ detail.commercial.jianliContract.amount != null ? detail.commercial.jianliContract.amount + ' 元' : '—' }}</span></div>
                    </div>
                  </div>
                </div>
                <div v-if="props.policyType !== 'nonstandard'" class="info-section">
                  <div class="info-section-title">付款节点<span class="section-sub" style="margin-left:8px">标准政策自动匹配</span></div>
                  <div class="payment-nodes">
                    <div v-for="node in STANDARD_PAYMENT_NODES" :key="node.key" class="payment-node-row">
                      <span class="payment-node-label">{{ node.label }}</span>
                      <span class="payment-node-pct">{{ node.pct }}%</span>
                      <span class="payment-node-desc">{{ node.desc }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </a-tab-pane>

            <!-- ──────── 备案 TAB ──────── -->
            <a-tab-pane key="record" tab="备案">
              <div class="tab-body">
                <div class="info-section" style="margin-top:0">
                  <div class="info-section-title">备案证信息</div>
                  <template v-if="detail.filingCert">
                    <div class="info-grid">
                      <div class="info-item"><span class="info-label">备案证文件名</span><span class="info-value">{{ detail.filingCert.fileName }}</span></div>
                      <div class="info-item"><span class="info-label">备案类型</span><span class="info-value">{{ detail.filingCert.filingType }}</span></div>
                      <div class="info-item"><span class="info-label">备案证项目名称</span><span class="info-value">{{ detail.filingCert.projectName }}</span></div>
                      <div class="info-item"><span class="info-label">备案证项目代码</span><span class="info-value">{{ detail.filingCert.projectCode }}</span></div>
                      <div class="info-item"><span class="info-label">产权公司</span><span class="info-value">{{ detail.filingCert.ownershipCompany }}</span></div>
                      <div class="info-item"><span class="info-label">备案证编号</span><span class="info-value">{{ detail.filingCert.certNo }}</span></div>
                      <div class="info-item"><span class="info-label">备案证容量(W)</span><span class="info-value">{{ detail.filingCert.capacity }}</span></div>
                      <div class="info-item"><span class="info-label">备案证类型</span><span class="info-value">{{ detail.filingCert.certType }}</span></div>
                      <div class="info-item"><span class="info-label">备案证批复时间</span><span class="info-value">{{ detail.filingCert.approvalDate }}</span></div>
                      <div class="info-item"><span class="info-label">发文机关</span><span class="info-value">{{ detail.filingCert.issuingAuthority }}</span></div>
                      <div class="info-item info-item--span2"><span class="info-label">备案证批复内容</span><span class="info-value">{{ detail.filingCert.approvalContent }}</span></div>
                      <div class="info-item info-item--span2"><span class="info-label">备案证附件</span><span class="info-value"><FileAttachmentView v-if="detail.filingCert.attachmentName" :files="[detail.filingCert.attachmentName]" /><span v-else>—</span></span></div>
                    </div>
                  </template>
                  <span v-else class="empty-hint">暂未关联备案证</span>
                </div>
              </div>
            </a-tab-pane>

            <!-- ──────── 开工 TAB（只读） ──────── -->
            <a-tab-pane key="start" tab="开工">
              <div class="tab-body">
                <div class="info-section" style="margin-top:0">
                  <div class="info-section-title">开工信息</div>
                  <div class="info-grid">
                    <div class="info-item"><span class="info-label">现场负责人</span><span class="info-value">{{ detail.startInfo.siteManager || '—' }}</span></div>
                    <div class="info-item"><span class="info-label">负责人电话</span><span class="info-value">{{ detail.startInfo.siteManagerPhone || '—' }}</span></div>
                    <div class="info-item"><span class="info-label">开工日期</span><span class="info-value">{{ detail.startInfo.startDate || '—' }}</span></div>
                  </div>
                </div>
                <div class="info-section">
                  <div class="info-section-title">工程资料</div>
                  <div class="info-grid">
                    <div class="info-item info-item--span2"><span class="info-label">中高压施工单位保险</span><span class="info-value"><FileAttachmentView v-if="detail.startInfo.insuranceFiles?.length" :files="detail.startInfo.insuranceFiles" /><span v-else>—</span></span></div>
                    <div class="info-item info-item--span2"><span class="info-label">质量安全技术交底</span><span class="info-value"><FileAttachmentView v-if="detail.startInfo.safetyDisclosureFiles?.length" :files="detail.startInfo.safetyDisclosureFiles" /><span v-else>—</span></span></div>
                    <div class="info-item info-item--span2"><span class="info-label">其他</span><span class="info-value"><FileAttachmentView v-if="detail.startInfo.engineeringOtherFiles?.length" :files="detail.startInfo.engineeringOtherFiles" /><span v-else>—</span></span></div>
                  </div>
                </div>
                <div class="info-section">
                  <div class="info-section-title">技术资料</div>
                  <div class="info-grid">
                    <div class="info-item info-item--span2"><span class="info-label">技术交底</span><span class="info-value"><FileAttachmentView v-if="detail.startInfo.techDisclosureFiles?.length" :files="detail.startInfo.techDisclosureFiles" /><span v-else>—</span></span></div>
                    <div class="info-item info-item--span2"><span class="info-label">设备技术协议</span><span class="info-value"><FileAttachmentView v-if="detail.startInfo.equipmentAgreementFiles?.length" :files="detail.startInfo.equipmentAgreementFiles" /><span v-else>—</span></span></div>
                  </div>
                </div>
                <div class="info-section">
                  <div class="info-section-title">施工人员</div>
                  <a-table :data-source="detail.startInfo.personnel" :columns="personnelReadonlyColumns" :pagination="false" size="small" :locale="{ emptyText: '暂无施工人员' }" />
                </div>
              </div>
            </a-tab-pane>

            <!-- ──────── 到货 TAB（只读） ──────── -->
            <a-tab-pane key="stock" tab="到货">
              <div class="tab-body">
                <div class="info-section" style="margin-top:0">
                  <div class="info-section-title">到货信息</div>
                  <div v-if="sharedStockRecords.length > 0" style="display:flex;align-items:center;gap:8px;padding:10px 14px;margin-bottom:12px;background:rgba(22,163,74,.06);border:1px solid rgba(22,163,74,.25);border-radius:6px;font-size:13px;color:#16a34a;">
                    <CheckCircleFilled style="font-size:15px;flex-shrink:0" />
                    全部物料已到货，共 {{ sharedStockRecords.length }} 张到货单
                  </div>
                  <a-empty v-else description="暂无到货记录" style="padding:24px 0" />
                  <div v-for="record in sharedStockRecords" :key="record.id" class="payment-contract-card">
                    <div
                      class="payment-contract-header"
                      style="display:flex;justify-content:space-between;align-items:flex-start;cursor:pointer"
                      :style="collapsedStockCards.has(record.id) ? { borderBottom: 'none' } : {}"
                      @click="toggleStockCard(record.id)"
                    >
                      <div>
                        <div class="payment-contract-type" style="display:flex;align-items:center;gap:8px">
                          {{ record.orderNo }}
                          <a-tag :color="record.arrivalType === '全部到货' ? 'success' : 'processing'" style="margin:0">{{ record.arrivalType }}</a-tag>
                          <a-tag color="success" style="margin:0">审核通过</a-tag>
                        </div>
                        <div class="payment-contract-meta-row" style="margin-top:8px">
                          <span class="payment-meta-item"><span class="payment-meta-label">物料类型</span><span class="payment-meta-value">{{ record.materialType }}</span></span>
                          <span class="payment-meta-item"><span class="payment-meta-label">创建人</span><span class="payment-meta-value">{{ record.creator }}</span></span>
                          <span class="payment-meta-item"><span class="payment-meta-label">创建时间</span><span class="payment-meta-value">{{ record.createTime }}</span></span>
                        </div>
                      </div>
                      <DownOutlined class="section-toggle-icon" :class="{ rotated: collapsedStockCards.has(record.id) }" />
                    </div>
                    <table v-show="!collapsedStockCards.has(record.id)" class="payment-ratio-table">
                      <thead>
                        <tr>
                          <th style="width:48px">序号</th><th style="width:72px">类型</th><th style="width:90px">物料编号</th>
                          <th style="width:160px">物料描述</th><th style="width:48px">单位</th><th style="width:72px">设计数量</th>
                          <th style="width:90px">本次到货数量</th><th style="width:100px">剩余到货数量</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="(item, idx) in record.items" :key="item.code">
                          <td>{{ idx + 1 }}</td><td>{{ item.type }}</td><td>{{ item.code }}</td>
                          <td>{{ item.name }}</td><td>{{ item.unit }}</td><td>{{ item.designQty }}</td>
                          <td>{{ item.arrivedQty ?? item.designQty }}</td>
                          <td style="color:#ff4d4f;font-weight:500">{{ Math.max(0, item.pendingQty - (item.arrivedQty ?? 0)) }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </a-tab-pane>

            <!-- ──────── 完工 TAB（可编辑） ──────── -->
            <a-tab-pane key="complete" tab="完工" force-render>
              <a-form ref="completeRef" :colon="false" :model="completeForm" layout="vertical" style="padding: 20px">

                <!-- 完工信息 -->
                <div class="info-section-title">完工信息</div>
                <a-row :gutter="[24, 0]">
                  <a-col :span="6">
                    <a-form-item label="现场负责人" name="siteManager"
                      :rules="[{ required: true, message: '请输入现场负责人' }]">
                      <a-input v-model:value="completeForm.siteManager" placeholder="请输入" :maxlength="30" />
                    </a-form-item>
                  </a-col>
                  <a-col :span="6">
                    <a-form-item label="负责人电话" name="siteManagerPhone"
                      :rules="[
                        { required: true, message: '请输入手机号' },
                        { pattern: /^1\d{10}$/, message: '请输入正确的手机号' }
                      ]">
                      <a-input v-model:value="completeForm.siteManagerPhone" placeholder="请输入" :maxlength="11" />
                    </a-form-item>
                  </a-col>
                  <a-col :span="6">
                    <a-form-item label="实际完工日期" name="completeDate"
                      :rules="[{ required: true, message: '请选择实际完工日期' }]">
                      <a-date-picker v-model:value="completeForm.completeDate" style="width:100%" format="YYYY-MM-DD" placeholder="请选择" />
                    </a-form-item>
                  </a-col>
                </a-row>

                <a-divider style="margin-top: 0" />

                <!-- 应用场景（只读，数据来自建档） -->
                <div class="info-section-title">应用场景</div>
                <div style="font-size:14px;color:rgba(0,0,0,0.65);margin-bottom:12px">
                  应用场景是否混装：{{ detail.scenes.length > 1 ? '是' : '否' }}
                </div>
                <a-table :columns="sceneColumns" :data-source="detail.scenes" :pagination="false" size="small" style="margin-bottom:20px" />

                <!-- 设备信息 -->
                <div class="info-section-title">设备信息</div>
                <!-- 设备信息内容卡片 -->
                <div class="device-inner-card">
                <!-- 子 tab -->
                <a-tabs v-model:activeKey="deviceTab" size="small" class="device-inner-tabs">
                  <a-tab-pane key="module" tab="组件" />
                  <a-tab-pane key="inverter" tab="逆变器" />
                  <a-tab-pane key="sim" tab="监控SIM" />
                  <template #rightExtra>
                    <div class="device-toolbar">
                      <a-space :size="8">
                        <template v-if="deviceTab === 'sim'">
                          <a-button size="small" @click="addSimRow">增行</a-button>
                        </template>
                        <template v-else>
                        <a-button size="small" @click="downloadDeviceTemplate">下载模板</a-button>
                        <a-upload accept=".xlsx,.xls,.csv" :show-upload-list="false" :before-upload="handleDeviceFileImport">
                          <a-button size="small">导入</a-button>
                        </a-upload>
                        </template>
                        <template v-if="deviceTab === 'module'">
                          <a-button size="small" @click="handleDeviceVerify">预校验序列号</a-button>
                          <a-button
                            size="small"
                            :disabled="moduleUnattestedRows.length === 0 && moduleAttestedRows.length === 0"
                            @click="moduleUnattestedRows.length === 0 && moduleAttestedRows.length > 0 ? openSubmittedAttestation() : openDeviceAttestation()"
                          >
                            <template v-if="moduleUnattestedRows.length === 0 && moduleAttestedRows.length > 0">已佐证（{{ moduleAttestedRows.length }} 条）</template>
                            <template v-else-if="moduleUnattestedRows.length > 0">未佐证（{{ moduleUnattestedRows.length }} 条）</template>
                            <template v-else>佐证</template>
                          </a-button>
                        </template>
                        <template v-if="deviceTab !== 'sim'">
                          <a-button size="small">导出</a-button>
                        </template>
                      </a-space>
                    </div>
                  </template>
                </a-tabs>
                <!-- 序列号表格 -->
                <div class="device-sn-table">
                <a-table :columns="deviceColumns" :data-source="currentDeviceSerials" row-key="id" :pagination="false" size="small" :scroll="{ y: 400 }" style="margin-bottom:8px">
                  <template #headerCell="{ column }">
                    <template v-if="['monitorModule','sn','collectorId','spec'].includes(column.key)">
                      <span style="color:#ff4d4f;margin-right:2px">*</span>{{ column.title }}
                    </template>
                  </template>
                  <template #bodyCell="{ column, record, index }">
                    <template v-if="column.key === 'idx'">{{ index + 1 }}</template>
                    <template v-else-if="column.key === 'sn'">
                      <a-input
                        v-model:value="record.sn"
                        placeholder="请输入"
                        allow-clear
                        :style="deviceTab === 'module' ? 'width:320px' : 'width:100%'"
                        :status="(record as ModuleSerial).status === 'blocked' ? 'error' : (record as ModuleSerial).status === 'needs-attestation' && !(record as ModuleSerial).attestationSubmitted && !attestedSerialNos.has(record.sn) ? 'warning' : undefined"
                      />
                      <div v-if="(record as ModuleSerial).status === 'blocked'" style="font-size:12px;color:#ff4d4f;margin-top:2px">
                        {{ (record as ModuleSerial).validationMessage }}
                      </div>
                      <div v-else-if="(record as ModuleSerial).status === 'needs-attestation'" style="font-size:12px;margin-top:2px">
                        <template v-if="(record as ModuleSerial).attestationSubmitted || attestedSerialNos.has(record.sn)">
                          <a-button type="link" size="small" style="padding:0;font-size:12px;height:auto;color:#1677ff" @click="openSubmittedAttestation">已佐证 →</a-button>
                        </template>
                        <template v-else>
                          <span style="color:#faad14">{{ (record as ModuleSerial).validationMessage }}</span>
                          <a-button type="link" size="small" style="padding:0;font-size:12px;height:auto;color:#1677ff" @click="openDeviceAttestation">去佐证 →</a-button>
                        </template>
                      </div>
                    </template>
                    <template v-else-if="column.key === 'collectorId'">
                      <a-input v-model:value="(record as InverterSerial).collectorId" placeholder="请输入" allow-clear style="width:100%" />
                    </template>
                    <template v-else-if="column.key === 'monitorModule'">
                      <a-select v-model:value="(record as InverterSerial).monitorModule" placeholder="请选择" style="width:100%" allow-clear>
                        <a-select-option value="MON-A1">MON-A1</a-select-option>
                        <a-select-option value="MON-A2">MON-A2</a-select-option>
                        <a-select-option value="MON-A3">MON-A3</a-select-option>
                        <a-select-option value="MON-B1">MON-B1</a-select-option>
                      </a-select>
                    </template>
                    <template v-else-if="column.key === 'spec'">
                      <a-select v-model:value="(record as InverterSerial).spec" placeholder="请选择" style="width:100%" allow-clear>
                        <a-select-option value="25kW/600V">25kW/600V</a-select-option>
                        <a-select-option value="50kW/800V">50kW/800V</a-select-option>
                        <a-select-option value="80kW/1000V">80kW/1000V</a-select-option>
                        <a-select-option value="100kW/1000V">100kW/1000V</a-select-option>
                      </a-select>
                    </template>
                    <template v-else-if="column.key === 'simCard'">
                      <a-input v-model:value="(record as InverterSerial).simCard" placeholder="请输入" allow-clear style="width:100%" />
                    </template>
                    <template v-else-if="column.key === 'meterSpec'">
                      <a-input v-model:value="(record as InverterSerial).meterSpec" placeholder="请输入" allow-clear style="width:100%" />
                    </template>
                    <template v-else-if="column.key === 'cardNo'">
                      <a-input
                        v-model:value="(record as SimSerial).cardNo"
                        placeholder="请输入手机号"
                        allow-clear
                        :maxlength="11"
                        style="width:66%"
                        :status="simDuplicates.has((record as SimSerial).cardNo) ? 'error' : undefined"
                      />
                      <div v-if="simDuplicates.has((record as SimSerial).cardNo)" style="font-size:12px;color:#ff4d4f;margin-top:2px">卡号重复</div>
                    </template>
                    <template v-else-if="column.key === 'carrier'">
                      <a-select v-model:value="(record as SimSerial).carrier" placeholder="请选择" style="width:100%" allow-clear>
                        <a-select-option v-for="opt in CARRIER_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</a-select-option>
                      </a-select>
                    </template>
                    <template v-else-if="column.key === 'remark'">
                      <a-input v-model:value="(record as SimSerial).remark" placeholder="请输入" allow-clear :maxlength="500" style="width:66%" />
                    </template>
                    <template v-else-if="column.key === 'status'">
                      <a-tag v-if="(record as ModuleSerial).attestationSubmitted" color="processing">已佐证</a-tag>
                      <a-tag v-else-if="(record as ModuleSerial).status === 'passed'" color="success">通过</a-tag>
                      <a-tag v-else-if="(record as ModuleSerial).status === 'blocked'" color="error">阻断</a-tag>
                      <a-tag v-else-if="(record as ModuleSerial).status === 'needs-attestation'" color="warning">需佐证</a-tag>
                      <a-tag v-else>待校验</a-tag>
                    </template>
                    <template v-else-if="column.key === 'action'">
                      <a-button v-if="deviceTab === 'sim'" type="link" danger size="small" style="padding:0" @click="removeSimRow(record.id)">删除</a-button>
                      <a-button v-else type="link" danger size="small" style="padding:0" disabled>删除</a-button>
                    </template>
                  </template>
                </a-table>
                </div>
                </div>

                <a-divider style="margin-top: 0" />

                <!-- 工程图片 -->
                <div class="info-section-title">工程图片</div>
                <a-row :gutter="[24, 0]">
                  <a-col v-for="n in 16" :key="n" :span="12">
                    <a-form-item :label="`配置照片${n}`">
                      <a-upload
                        v-model:file-list="completeForm.photos[`photo${n}`]"
                        list-type="picture-card"
                        :custom-request="noopRequest"
                        accept="image/*"
                        multiple
                      >
                        <div class="upload-trigger">
                          <PlusOutlined /><div style="margin-top:4px;font-size:12px">上传</div>
                        </div>
                      </a-upload>
                    </a-form-item>
                  </a-col>
                </a-row>

                <a-divider style="margin-top: 0" />

                <!-- 表单资料 -->
                <div class="info-section-title">表单资料</div>
                <a-row :gutter="[24, 16]">
                  <a-col v-for="n in 5" :key="n" :span="12">
                    <a-form-item :label="`配置附件${n}`">
                      <FileUploadField v-model:file-list="completeForm.attachments[`attach${n}`]" accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.rar">
                        <a-button><template #icon><UploadOutlined /></template>点击上传</a-button>
                      </FileUploadField>
                    </a-form-item>
                  </a-col>
                </a-row>

              </a-form>
            </a-tab-pane>

          </a-tabs>
        </div>
      </div>

    </div>
  </div>

  <!-- 佐证弹窗 -->
  <AttestationModal
    v-model:open="attestOpen"
    :rows="attestRows"
    :on-submit-attestation="submitAttestation"
    :already-submitted="attestViewSubmitted"
    @submitted="handleAttestationSubmitted"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { message } from 'ant-design-vue'
import FileAttachmentView from '../components/FileAttachmentView.vue'
import AttestationModal from '../components/AttestationModal.vue'
import FileUploadField from '../components/FileUploadField.vue'
import RejectCard from '../components/RejectCard.vue'
import { sharedStockRecords } from '../stores/stockRecords'
import {
  LeftOutlined, CopyOutlined,
  CheckCircleOutlined, CloseCircleOutlined, EditOutlined, FileAddOutlined,
  DownOutlined, UploadOutlined, PlusOutlined, QuestionCircleOutlined, CheckCircleFilled,
} from '@ant-design/icons-vue'

const props = defineProps<{ editId?: string | null; initStatus?: string | null; initData?: Record<string, any> | null; policyType?: string }>()
const emit = defineEmits<{ back: [] }>()

const projectInfoOpen = ref(false)
const activeTab = ref('complete')

// ── 完工 tab 表单 ──
const completeRef = ref()
const completeForm = reactive({
  siteManager:              '',
  siteManagerPhone:         '',
  completeDate:             null as any,

  photos: {
    photo1: [] as any[],
    photo2: [] as any[],
    photo3: [] as any[],
    photo4: [] as any[],
    photo5: [] as any[],
    photo6: [] as any[],
    photo7: [] as any[],
    photo8: [] as any[],
    photo9: [] as any[],
    photo10: [] as any[],
    photo11: [] as any[],
    photo12: [] as any[],
    photo13: [] as any[],
    photo14: [] as any[],
    photo15: [] as any[],
    photo16: [] as any[],
  },
  attachments: {
    attach1: [] as any[],
    attach2: [] as any[],
    attach3: [] as any[],
    attach4: [] as any[],
    attach5: [] as any[],
  },
})

const collapsedStockCards = reactive(new Set<string>())
function toggleStockCard(id: string) {
  if (collapsedStockCards.has(id)) collapsedStockCards.delete(id)
  else collapsedStockCards.add(id)
}

// ── 设备信息 ──
const deviceTab = ref<'module' | 'inverter' | 'sim'>('module')

type ValidationStatus = 'pending' | 'passed' | 'blocked' | 'needs-attestation'
interface ModuleSerial  { id: string; code: string; name: string; sn: string; status: ValidationStatus; validationCode?: string; validationMessage?: string; validationDetail?: string; attestationReason?: string; attestationSubmitted?: boolean }
interface InverterSerial { id: string; name: string; code: string; monitorModule: string; sn: string; collectorId: string; spec: string; simCard: string; meterSpec: string }
interface SimSerial { id: string; cardNo: string; carrier: string; remark: string }

const CARRIER_OPTIONS = [
  { value: 'mobile',  label: '中国移动' },
  { value: 'unicom',  label: '中国联通' },
  { value: 'telecom', label: '中国电信' },
]

const moduleColumns = [
  { title: '序号',     key: 'idx',    width: 52 },
  { title: '料号编码', dataIndex: 'code',   key: 'code',   width: 140 },
  { title: '料号名称', dataIndex: 'name',   key: 'name',   width: 320 },
  { title: '序列号',   dataIndex: 'sn',     key: 'sn' },
  { title: '校验状态', dataIndex: 'status', key: 'status', width: 240 },
  { title: '操作',     key: 'action', width: 64 },
]
const inverterColumns = [
  { title: '序号',       key: 'idx',          width: 52 },
  { title: '物料名称',   dataIndex: 'name',        key: 'name' },
  { title: '物料编码',   dataIndex: 'code',        key: 'code' },
  { title: '监控器模块', dataIndex: 'monitorModule', key: 'monitorModule' },
  { title: '设备序列号', dataIndex: 'sn',          key: 'sn' },
  { title: '采集器编号', dataIndex: 'collectorId', key: 'collectorId' },
  { title: '逆变器规格', dataIndex: 'spec',        key: 'spec' },
  { title: '物联网卡号', dataIndex: 'simCard',     key: 'simCard' },
  { title: '智能电表规格', dataIndex: 'meterSpec', key: 'meterSpec' },
  { title: '操作',       key: 'action', width: 64 },
]
const simColumns = [
  { title: '序号',   key: 'idx',     width: 52 },
  { title: '卡号',   dataIndex: 'cardNo',  key: 'cardNo' },
  { title: '运营商', dataIndex: 'carrier', key: 'carrier', width: 140 },
  { title: '备注',   dataIndex: 'remark',  key: 'remark' },
  { title: '操作',   key: 'action',  width: 64 },
]
const deviceColumns = computed(() =>
  deviceTab.value === 'module' ? moduleColumns
  : deviceTab.value === 'inverter' ? inverterColumns
  : simColumns
)

// COMPLETE_PHOTO_CATEGORIES removed — using v-for n in 16/5 inline

// ── 只读表格列 ──
const personnelReadonlyColumns = [
  { title: '序号',   key: 'index',          width: 60,  customRender: ({ index }: any) => index + 1 },
  { title: '姓名',   dataIndex: 'name',     key: 'name' },
  { title: '岗位',   dataIndex: 'position', key: 'position' },
  { title: '手机号', dataIndex: 'phone',    key: 'phone' },
]
const stockReadonlyColumns = [
  { title: '序号',     key: 'index',        width: 60,  customRender: ({ index }: any) => index + 1 },
  { title: '物料名称', dataIndex: 'name',   key: 'name',   width: 220, ellipsis: true },
  { title: '类型',     dataIndex: 'type',   key: 'type',   width: 80 },
  { title: '单位',     dataIndex: 'unit',   key: 'unit',   width: 64 },
  { title: '申请数量', dataIndex: 'applied',  key: 'applied',  width: 100 },
  { title: '到货数量', dataIndex: 'arrived',  key: 'arrived',  width: 100 },
  { title: '状态',     dataIndex: 'status',   key: 'status',   width: 100 },
]
const jiagongReadonlyColumns = [
  { title: '序号',     key: 'index',     width: 52,  customRender: ({ index }: any) => index + 1 },
  { title: '物料编码', dataIndex: 'code',    key: 'code',  width: 120 },
  { title: '物料名称', dataIndex: 'name',    key: 'name',  width: 220, ellipsis: true },
  { title: '物料组',   dataIndex: 'group',   key: 'group', width: 90 },
  { title: '单位',     dataIndex: 'unit',    key: 'unit',  width: 64 },
  { title: '确认数量', dataIndex: 'quantity',key: 'quantity', width: 80 },
]
const yigongReadonlyColumns = [
  { title: '序号',     key: 'index',    width: 52,  customRender: ({ index }: any) => index + 1 },
  { title: '类型',     dataIndex: 'type',  key: 'type',  width: 80 },
  { title: '物料编号', dataIndex: 'code',  key: 'code',  width: 120 },
  { title: '物料描述', dataIndex: 'name',  key: 'name',  width: 220, ellipsis: true },
  { title: '单位',     dataIndex: 'unit',  key: 'unit',  width: 64 },
  { title: '确认数量', dataIndex: 'quantity', key: 'quantity', width: 80 },
]
const sceneColumns = [
  { title: '序号',         key: 'index',       width: 60,  customRender: ({ index }: any) => index + 1 },
  { title: '应用场景',     dataIndex: 'type',  key: 'type',    width: 140 },
  { title: '应用场景块数', dataIndex: 'blocks',key: 'blocks',  width: 120 },
  { title: '倾角',         dataIndex: 'tiltAngle', key: 'tiltAngle', width: 100, customRender: ({ text }: any) => text != null ? text + '°' : '—' },
  { title: '特殊方案',     dataIndex: 'specialPlan', key: 'specialPlan', width: 160, customRender: ({ text }: any) => text || '—' },
]

// ── scrollPad / tabsStuck ──
const detailBodyRef  = ref<HTMLElement | null>(null)
const tabsWrapperRef = ref<HTMLElement | null>(null)
const tabsStuck      = ref(false)
const scrollPad      = ref(0)

async function scrollToTabNav() {
  await nextTick()
  const body    = detailBodyRef.value
  const wrapper = tabsWrapperRef.value
  if (!body || !wrapper) return
  tabsStuck.value = true
  await nextTick()
  const target = Math.round(
    wrapper.getBoundingClientRect().top - body.getBoundingClientRect().top + body.scrollTop
  )
  const naturalScrollHeight = body.scrollHeight - scrollPad.value
  const neededPad = Math.max(0, target - naturalScrollHeight + body.clientHeight + 20)
  if (neededPad !== scrollPad.value) {
    scrollPad.value = neededPad
    await nextTick()
    void body.scrollHeight
  }
  _ignoreNextScroll = true
  body.scrollTop = target
}

let _scrollHandler: (() => void) | null = null
let _ignoreNextScroll = false
onMounted(() => {
  _scrollHandler = () => {
    if (_ignoreNextScroll) { _ignoreNextScroll = false; return }
    const body    = detailBodyRef.value
    const wrapper = tabsWrapperRef.value
    if (!body || !wrapper) return
    tabsStuck.value = wrapper.getBoundingClientRect().top <= body.getBoundingClientRect().top + 1
    if (!tabsStuck.value && body.scrollTop <= 1) scrollPad.value = 0
  }
  detailBodyRef.value?.addEventListener('scroll', _scrollHandler, { passive: true })
})
onBeforeUnmount(() => {
  if (_scrollHandler) detailBodyRef.value?.removeEventListener('scroll', _scrollHandler)
})

// ── 操作 ──
const canVoid = computed(() => detail.value.filingStatus === 'waiting_complete')

const saving = ref(false)
const noopRequest = ({ onSuccess }: any) => { setTimeout(() => onSuccess?.("ok"), 0) }
const submitting = ref(false)

function copyStationNo(no: string) {
  navigator.clipboard.writeText(no).then(() => message.success('已复制'))
}

async function handleSave() {
  saving.value = true
  await new Promise(r => setTimeout(r, 600))
  saving.value = false
  message.success('保存成功')
}

async function handleSubmit() {
  try {
    await completeRef.value?.validate()
  } catch {
    return
  }
  // SIM 监控校验
  if (simSerials.length === 0) {
    message.warning('必填SIM监控信息为空，请完善')
    deviceTab.value = 'sim'
    return
  }
  const emptyCard = simSerials.find(r => !r.cardNo || !r.carrier)
  if (emptyCard) {
    message.warning('请完善SIM监控信息中的卡号和运营商')
    deviceTab.value = 'sim'
    return
  }
  if (simDuplicates.value.size > 0) {
    message.warning('SIM卡号存在重复，请检查后提交')
    deviceTab.value = 'sim'
    return
  }
  submitting.value = true
  await new Promise(r => setTimeout(r, 600))
  submitting.value = false
  message.success('完工申请已提交')
  emit('back')
}

async function handleVoid() {
  await new Promise(r => setTimeout(r, 400))
  message.success('已作废')
  emit('back')
}

// ── 常量 ──
const STATUS_COLOR: Record<string, string> = {
  waiting_complete: 'default', reviewing_complete: 'processing', complete_rejected: 'error', completed: 'success',
}
const STATUS_LABEL: Record<string, string> = {
  waiting_complete: '待完工', reviewing_complete: '完工审核中', complete_rejected: '完工审核不通过', completed: '已完工',
}
const PROJECT_TYPE_LABEL: Record<string, string> = { emc: '常规 EMC', public_emc: '公建 EMC' }
const GRID_VOLTAGE_LABEL: Record<string, string> = { low: '低压', high: '中高压' }
const PUBLIC_BUILD_TYPE_LABEL: Record<string, string> = {
  education: '科教文体公建', medical: '医疗卫生公建', government: '党政政务机构',
  enforcement: '执法监管机构', public_welfare: '公益事业单位机构', other: '其他',
}
const GRID_MODE_LABEL: Record<string, string> = {
  full: '全额上网', surplus: '余电上网', surplus_no_grid: '余电不上网', offgrid: '离网',
}
const STEEL_ROOF_LABEL: Record<string, string> = {
  standing_seam: '直立锁边型', angle_drive: '角驰型', trapezoidal: '梯型',
}
const RUST_LABEL: Record<string, string> = { none: '无锈蚀', light: '局部轻度锈蚀', severe: '严重锈蚀' }
const INLET_CONN_LABEL: Record<string, string> = { dedicated: '专线接入', tee: 'T接接入' }
const INTERVAL_LABEL: Record<string, string> = {
  yes: '有，需落实备用间隔是否可给光伏',
  space: '无，但有安装间隔的空间',
  no: '无',
}
const PHOTO_CATEGORIES = [
  { key: 'exterior', label: '外观照片' },
  { key: 'roof',     label: '屋顶照片' },
  { key: 'meter',    label: '电表照片' },
  { key: 'inverter', label: '逆变器位置' },
  { key: 'other',    label: '其他' },
]
const STANDARD_PAYMENT_NODES = [
  { key: 'start',    label: '开工款',    pct: 30, desc: '开工验收后 15 个工作日内到账' },
  { key: 'grid',     label: '并网款',    pct: 30, desc: '并网验收后 15 个工作日内到账' },
  { key: 'complete', label: '竣工验收款', pct: 30, desc: '竣工验收后 15 个工作日内到账' },
  { key: 'warranty', label: '质保金',    pct: 10, desc: '质保期满后 30 个工作日内到账' },
]

// ── mock 数据 ──
const detail = ref({
  id: 'LNC-2026-0036',
  filingStatus: (props.initData?.filingStatus ?? props.initStatus ?? 'waiting_complete') as string,
  stationType: '工商业',
  stationNo:   props.initData?.stationNo ?? 'LNC-2026-0036',
  oaNo: 'A304202607100012',
  projectName: props.initData?.projectName ?? '绍兴市诸暨市纺织企业屋顶光伏',
  projectType: 'emc',
  policyMatched: true,
  regionCompany: '浙江区域公司',
  region: ['浙江省', '绍兴市', '诸暨市'],
  addressDetail: '大唐工业区某纺织企业屋顶',
  capacity: 280,
  gridVoltage: 'low',
  agentName: props.initData?.agentName ?? '绍兴新能源发展有限公司',
  userEntName: '诸暨市某纺织有限公司',
  propertyProof:  ['产权证明.pdf'],
  bizLicense:     ['营业执照.pdf'],
  bankAccountCert:'开户许可证.pdf',
  idCardFront:    '身份证正面.jpg',
  idCardBack:     '身份证反面.jpg',
  developerName:   '浙江华电开发有限公司',
  constructorName: '绍兴建工集团有限公司',
  supervisorName:  '浙江工程监理有限公司',
  designerName:    '',
  emcPrice:        0.6200,
  emcYears:        20,
  consumptionRate: 85,
  publicBuildType: null as string | null,
  projectCompany:   '绍兴诸暨光伏资产有限公司',
  epcCompany:       '正泰安能 EPC 有限公司',
  ownershipCompany: '绍兴诸暨光伏资产有限公司',
  commercial: {
    emcContract:    { contractNo: 'EMC-2026-0036', paymentCategory: '应收款项', partyA: '绍兴某甲方有限公司', partyB: '绍兴诸暨光伏资产有限公司', amount: 1050000, signDate: '2026-03-10', remark: '', files: ['EMC协议.pdf'] },
    smallEContract: { contractNo: 'XE-2026-0036', paymentCategory: '应付款项', partyA: '正泰安能数字能源（浙江）股份有限公司', partyB: '绍兴建工集团有限公司', amount: 700000, signDate: '2026-03-12', remark: '', files: ['小E施工合同.pdf'], controllerName: '李四', controllerIdCard: '330602199001011234', controllerSpouseName: '', controllerSpouseIdCard: '' },
    designContract: { contractNo: 'DS-2026-0036', paymentCategory: '应付款项', partyA: '正泰安能数字能源（浙江）股份有限公司', partyB: '浙江华电开发有限公司', amount: 40000, signDate: '2026-03-15', remark: '', files: [] },
    jianliContract: { contractNo: 'JL-2026-0036', paymentCategory: '应付款项', partyA: '绍兴诸暨光伏资产有限公司', partyB: '浙江工程监理有限公司', amount: 25000, signDate: '2026-03-18', remark: '', files: [] },
    otherContracts: [],
  },
  gridMode: 'surplus',
  buildingCount: 2,
  roofLightSteel: 2, roofConcrete: 0, roofOther: 0,
  siteLayoutFiles: ['总平面布置图.pdf'],
  steelRoofType: 'standing_seam',
  rustCondition: 'none',
  hasObstacle: 'no', obstacleHeight: null as number | null, obstacleWidth: null as number | null,
  hasSkylight: 'no', skylightWidth: null as number | null,
  inletVoltage: 10, inletConnectionType: 'dedicated', circuitCount: 2, cableSpec: 120,
  transformerCount: 2, transformerKVA: 800, hasInterval: 'yes',
  hasIndoorSpace: 'yes', indoorLength: 5.0, indoorWidth: 3.5,
  hasCablePipe: 'yes', cablePipeType: 'trench',
  drawingFiles: ['项目图纸.dwg'], electricityFiles: ['用电情况报告.pdf'], approvalFiles: ['接入批复文件.pdf'],
  scenes: [{ type: '屋顶', blocks: 480, tiltAngle: 10, specialPlan: null }],
  photos: {
    exterior: Array.from({ length: 6 }, (_, i) => `https://picsum.photos/seed/cext${i + 1}/160/160`),
    roof:     Array.from({ length: 3 }, (_, i) => `https://picsum.photos/seed/croof${i + 1}/160/160`),
    meter:    Array.from({ length: 2 }, (_, i) => `https://picsum.photos/seed/cmeter${i + 1}/160/160`),
    inverter: Array.from({ length: 2 }, (_, i) => `https://picsum.photos/seed/cinv${i + 1}/160/160`),
    other:    [] as string[],
  },
  jiagongBom: [
    { code: 'M001', name: '单晶硅光伏组件 545W', group: '组件',   unit: '块', quantity: 80 },
    { code: 'M002', name: '组串式逆变器 50kW',   group: '逆变器', unit: '台', quantity: 6 },
  ],
  yigongBom: [
    { code: 'TB0002', name: '400kVA柱上变压器', type: '中高压', unit: '台', quantity: 1 },
  ],
  designQualFiles: ['设计资质证书.pdf'], electricalDesignFiles: ['电气设计图.dwg'],
  structuralDesignFiles: ['结构设计图.dwg'], safetyAssessFiles: [], otherAttachFiles: [],
  filingCert: {
    fileName: '诸暨纺织企业光伏备案证', filingType: '备案',
    projectName: '绍兴市诸暨市纺织企业屋顶光伏项目', projectCode: 'PJ-2026-0036',
    ownershipCompany: '绍兴诸暨光伏资产有限公司', certNo: 'BC-2026-0036', capacity: 280000,
    certType: '分布式光伏', approvalDate: '2026-04-01', issuingAuthority: '诸暨市发展和改革局',
    approvalContent: '同意该项目建设分布式光伏发电项目，装机容量280kW，接入10kV电网。',
    attachmentName: '诸暨纺织备案批复文件.pdf',
  },
  startInfo: {
    siteManager: '张建国', siteManagerPhone: '13812340001', startDate: '2026-05-15',
    insuranceFiles: ['中高压施工保险_2026.pdf'], safetyDisclosureFiles: ['质量安全技术交底书.pdf'],
    engineeringOtherFiles: [], techDisclosureFiles: ['技术交底文件.pdf'],
    equipmentAgreementFiles: ['设备技术协议.pdf'], techOtherFiles: [],
    personnel: [
      { id: 'p1', name: '张建国', position: '施工队长',   phone: '13812340001' },
      { id: 'p2', name: '李明',   position: '电工',       phone: '13812340002' },
      { id: 'p3', name: '王强',   position: '焊工',       phone: '13812340003' },
    ],
  },
  stockRecords: [
    { id: 1, name: '单晶硅光伏组件 545W', type: '甲供', unit: '块', applied: 480, arrived: 480, status: '已到货' },
    { id: 2, name: '组串式逆变器 50kW',   type: '甲供', unit: '台', applied: 6,   arrived: 6,   status: '已到货' },
    { id: 3, name: '400kVA柱上变压器',    type: '乙供', unit: '台', applied: 1,   arrived: 1,   status: '已到货' },
  ],
})

const moduleSerials = reactive<ModuleSerial[]>(
  detail.value.jiagongBom
    .filter((item: any) => item.group === '组件')
    .flatMap((item: any) =>
      Array.from({ length: item.quantity }, (_, i) => ({
        id: `m-${item.code}-${i}`,
        code: item.code,
        name: item.name,
        sn: '',
        status: 'pending' as const,
      }))
    )
)

const inverterSerials = reactive<InverterSerial[]>(
  detail.value.jiagongBom
    .filter((item: any) => item.group === '逆变器')
    .flatMap((item: any) =>
      Array.from({ length: item.quantity }, (_, i) => ({
        id: `inv-${item.code}-${i}`,
        name: item.name,
        code: item.code,
        monitorModule: '',
        sn: '',
        collectorId: '',
        spec: '',
        simCard: '',
        meterSpec: '',
      }))
    )
)

const simSerials = reactive<SimSerial[]>([])

const currentDeviceSerials = computed(() =>
  deviceTab.value === 'module' ? moduleSerials
  : deviceTab.value === 'inverter' ? inverterSerials
  : simSerials
)

// 本站内重复卡号（排除空值）
const simDuplicates = computed(() => {
  const seen = new Set<string>()
  const dups = new Set<string>()
  for (const r of simSerials) {
    if (!r.cardNo) continue
    if (seen.has(r.cardNo)) dups.add(r.cardNo)
    else seen.add(r.cardNo)
  }
  return dups
})

function addSimRow() {
  simSerials.push({ id: `sim-${Date.now()}`, cardNo: '', carrier: '', remark: '' })
}

function removeSimRow(id: string) {
  const idx = simSerials.findIndex(r => r.id === id)
  if (idx !== -1) simSerials.splice(idx, 1)
}

function removeDeviceSerial(id: string) {
  const list = deviceTab.value === 'module' ? moduleSerials : inverterSerials
  const idx = list.findIndex(r => r.id === id)
  if (idx !== -1) list.splice(idx, 1)
}

// ── mock 校验规则（与 serial-number-ui 保持一致）──
function lookupSerialValidation(sn: string): Partial<ModuleSerial> {
  switch (sn) {
    case 'SN20241201A901': return { status: 'blocked', validationCode: 'SCRAPPED', validationMessage: '序列号已报废，请更换或提交工单处理', validationDetail: sn + '序列号已报废，禁止录入，请更换或提交工单处理', attestationReason: undefined }
    case 'SN20241201A904': return { status: 'needs-attestation', validationCode: 'OCCUPIED', validationMessage: '序列号已被 ZT-GD-2024-08831 电站占用', validationDetail: sn + '序列号已被 ZT-GD-2024-08831 电站占用，请核实或进行佐证', attestationReason: '他商电站占用' }
    default: return { status: 'passed', validationCode: undefined, validationMessage: undefined, validationDetail: undefined, attestationReason: undefined }
  }
}

// ── 佐证状态 ──
const attestOpen = ref(false)
const attestRows = ref<any[]>([])
const attestedPhotos = ref<Map<string, any[]>>(new Map())
const attestedSerialNos = ref<Set<string>>(new Set())
const attestViewSubmitted = ref(false)

const moduleAttestationRows = computed(() =>
  moduleSerials.filter(r => r.status === 'needs-attestation')
)
const moduleUnattestedRows = computed(() =>
  moduleSerials.filter(r => r.status === 'needs-attestation' && !attestedSerialNos.value.has(r.sn) && !r.attestationSubmitted)
)
const moduleAttestedRows = computed(() =>
  moduleSerials.filter(r => r.status === 'needs-attestation' && (attestedSerialNos.value.has(r.sn) || r.attestationSubmitted))
)

function openDeviceAttestation() {
  const rows = moduleUnattestedRows.value.length > 0 ? moduleUnattestedRows.value : moduleAttestedRows.value
  attestRows.value = rows.map(row => ({
    key: row.id,
    materialCode: row.code,
    materialName: row.name,
    serialNo: row.sn,
    validationCode: row.validationCode,
    validationMessage: row.validationMessage,
    validationDetail: row.validationDetail,
    attestationReason: row.attestationReason,
    attestationSubmitted: row.attestationSubmitted,
    photos: attestedPhotos.value.get(row.sn) ?? [],
  }))
  attestViewSubmitted.value = false
  attestOpen.value = true
}

function openSubmittedAttestation() {
  attestRows.value = moduleAttestedRows.value.map(row => ({
    key: row.id,
    materialCode: row.code,
    materialName: row.name,
    serialNo: row.sn,
    validationCode: row.validationCode,
    validationMessage: row.validationMessage,
    validationDetail: row.validationDetail,
    attestationReason: row.attestationReason,
    attestationSubmitted: true,
    photos: attestedPhotos.value.get(row.sn) ?? [],
  }))
  attestViewSubmitted.value = true
  attestOpen.value = true
}

async function submitAttestation(data: any[]) {
  await new Promise(r => setTimeout(r, 600))
  console.log('佐证提交:', data)
}

function handleAttestationSubmitted(rows: any[]) {
  const serialNos = rows.map((r: any) => r.serialNo)
  attestedSerialNos.value = new Set([...attestedSerialNos.value, ...serialNos])
  const photosMap = new Map(attestedPhotos.value)
  rows.forEach((r: any) => {
    photosMap.set(r.serialNo, r.photos)
    const serial = moduleSerials.find(s => s.sn === r.serialNo)
    if (serial) serial.attestationSubmitted = true
  })
  attestedPhotos.value = photosMap
  message.success('序列号佐证已提交')
}

function downloadDeviceTemplate() {
  const isModule = deviceTab.value === 'module'
  const header = isModule ? '料号编码,料号名称,序列号' : '物料编码,物料名称,设备序列号,采集器编号,逆变器规格,物联网卡号,智能电表规格'
  const rows = isModule
    ? moduleSerials.map(r => `${r.code},${r.name},`)
    : inverterSerials.map(r => `${r.code},${r.name},,,,,`)
  const csv = [header, ...rows].join('\r\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = (isModule ? '组件' : '逆变器') + '序列号录入模板.csv'
  a.click()
  URL.revokeObjectURL(url)
}

function handleDeviceFileImport(file: File) {
  const reader = new FileReader()
  reader.onload = (e) => {
    const text = e.target?.result as string
    const lines = text.trim().split(/\r?\n/).filter(Boolean)
    if (lines.length < 2) { message.warning('文件内容为空'); return }
    const list = deviceTab.value === 'module' ? moduleSerials : inverterSerials
    let filled = 0
    let listIdx = 0
    for (const line of lines.slice(1)) {
      const cols = line.split(',').map((c: string) => c.replace(/^"|"$/g, '').trim())
      const sn = cols[2]
      if (!sn) continue
      while (listIdx < list.length && (list[listIdx] as any).sn) listIdx++
      if (listIdx >= list.length) break
      ;(list[listIdx] as any).sn = sn
      listIdx++
      filled++
    }
    filled ? message.success(`已导入 ${filled} 条序列号`) : message.warning('未找到有效序列号')
  }
  reader.readAsText(file, 'utf-8')
  return false
}

async function handleDeviceVerify() {
  if (deviceTab.value !== 'module') { message.info('逆变器暂不支持预校验'); return }
  message.loading({ content: '校验中…', key: 'verify', duration: 0 })
  await new Promise(r => setTimeout(r, 800))
  moduleSerials.forEach(row => {
    if (!row.sn) { row.status = 'pending'; return }
    const result = lookupSerialValidation(row.sn)
    Object.assign(row, result)
  })
  message.destroy('verify')
  const blocked = moduleSerials.filter(r => r.status === 'blocked')
  const needsAttest = moduleSerials.filter(r => r.status === 'needs-attestation')
  if (blocked.length || needsAttest.length) {
    message.warning(`校验完成，${blocked.length} 条阻断，${needsAttest.length} 条需佐证`)
  } else {
    message.success('序列号校验通过')
  }
}

watch(() => props.initStatus, (val) => {
  if (val) detail.value.filingStatus = val
})

const rejectInfo = computed(() => ({
  stage: '完工审核', reviewer: '李四（审核员）', time: '2026-08-20 15:30',
  reason: '竣工图不完整，请补充全套竣工图纸后重新提交。',
}))
</script>

<style scoped>
.detail-page { height: calc(100vh - 81px); overflow: hidden; background: #f5f5f5; display: flex; flex-direction: column; }
.detail-header { flex-shrink: 0; display: flex; align-items: center; gap: 160px; padding: 0 24px; height: 56px; background: #fff; border-bottom: 1px solid #f0f0f0; box-shadow: 0 1px 4px rgba(0,0,0,.06); }
.detail-header-left { display: flex; align-items: center; gap: 6px; flex: 1; min-width: 0; overflow: hidden; }
.detail-header-left :deep(.ant-tag) { flex-shrink: 0; margin-inline-end: 0; }
.node-dot-tag { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; color: rgba(0,0,0,0.65); background: #f5f5f5; border: 1px solid #d9d9d9; border-radius: 4px; padding: 0 7px; line-height: 20px; flex-shrink: 0; }
.node-dot-tag__dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.back-btn { color: #595959; flex-shrink: 0; }
.detail-title { font-size: 16px; font-weight: 600; margin-left: 4px; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex-shrink: 1; }
.detail-header-meta { display: flex; align-items: center; margin-left: 12px; gap: 0; flex-shrink: 0; }
.detail-header-meta-item { font-size: 13px; color: rgba(0,0,0,0.45); }
.detail-header-meta-divider { display: inline-block; width: 1px; height: 12px; background: rgba(0,0,0,0.15); margin: 0 8px; }

.detail-body { flex: 1; overflow-y: auto; padding: 0 16px 16px; overscroll-behavior: contain; }
.detail-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 16px; margin-top: 16px; }
.tabs-wrapper { background: #fff; border-radius: 8px; }
.detail-tabs :deep(> .ant-tabs-nav) { position: sticky; top: 0; z-index: 100; background: #fff; border-radius: 8px 8px 0 0; }
.tabs-stuck .detail-tabs :deep(> .ant-tabs-nav) { margin-left: -16px; margin-right: -16px; border-radius: 0; }

.detail-card { border-radius: 8px; }
.detail-card--plain { background: #fff; padding: 20px; }
.detail-tabs :deep(.ant-tabs-content-holder) { padding: 0; }
.tab-body { padding: 20px; background: #fff; border-radius: 0 0 8px 8px; }

.info-section { margin-top: 20px; padding-top: 20px; border-top: 1px solid #f5f5f5; }
.info-section:first-child, .section-title + .info-section { margin-top: 0; padding-top: 0; border-top: none; }
.tab-body--design .info-section { border-top: none; padding-top: 0; margin-top: 32px; }
.tab-body--commercial .info-section { border-top: none; padding-top: 0; margin-top: 32px; }

.section-title--toggle { cursor: pointer; display: flex; align-items: center; justify-content: space-between; user-select: none; }
.section-title--collapsed { margin-bottom: 0 !important; }
.section-toggle-icon { font-size: 12px; color: #8c8c8c; background: #f0f0f0; padding: 7px 6px 5px; border-radius: 4px; display: inline-flex; align-items: center; transition: transform 0.2s; }
.section-toggle-icon.rotated { transform: rotate(180deg); }
.section-title { font-size: 16px; font-weight: 500; color: #000; margin-bottom: 24px; }

.info-section-title { font-size: 16px; font-weight: 500; color: rgba(0,0,0,0.88); margin: 20px 0; display: flex; align-items: center; gap: 8px; }
.info-section-title::before { content: ''; display: inline-block; width: 3px; height: 16px; background: #1677ff; border-radius: 2px; flex-shrink: 0; }

.info-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
.info-item { display: flex; flex-direction: column; min-width: 0; }
.info-item--span2 { grid-column: span 2; }
.info-label { font-size: 14px; color: rgba(0,0,0,0.45); line-height: 22px; padding-bottom: 8px; white-space: nowrap; }
.info-value { font-size: 14px; color: rgba(0,0,0,0.88); line-height: 22px; word-break: break-word; }

.section-sub { font-size: 12px; color: #8c8c8c; }
.section-sub-title { font-size: 14px; font-weight: 600; color: rgba(0,0,0,0.88); margin-bottom: 16px; margin-top: 8px; }
.section-header { display: flex; align-items: center; justify-content: space-between; }

.contract-block-ro { border: 1px solid #f0f0f0; border-radius: 6px; margin-bottom: 16px; overflow: hidden; }
.contract-block-ro-header { background: #fafafa; padding: 10px 16px; font-size: 13px; font-weight: 600; color: rgba(0,0,0,0.85); border-bottom: 1px solid #f0f0f0; }
.contract-block-ro .info-grid { padding: 16px; }

.payment-nodes { display: flex; gap: 10px; margin-bottom: 20px; }
.payment-node-row { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 14px 16px; background: #fafafa; border: 1px solid #f0f0f0; border-radius: 6px; flex: 1; text-align: center; }
.payment-node-label { font-size: 13px; font-weight: 500; }

.device-inner-card { }
.device-inner-tabs { }
.device-inner-tabs .ant-tabs-nav { margin-bottom: 0; }
.device-inner-tabs :deep(.ant-tabs-nav)::before { display: none; }
.device-toolbar { display: flex; align-items: center; }
.device-toolbar :deep(.ant-btn) { height: 28px; }
.device-sn-table { padding-top: 8px; }

.sn-input-wrap { display: flex; flex-direction: column; gap: 2px; }
.sn-verified-hint { font-size: 12px; cursor: pointer; }
.sn-status-tag { font-size: 12px; border-radius: 4px; padding: 1px 7px; border: 1px solid; white-space: nowrap; }
.sn-status-tag--pending { color: rgba(0,0,0,0.45); border-color: #d9d9d9; background: #fff; }
.sn-status-tag--verified { color: #d46b08; border-color: #ffd591; background: #fff7e6; }
.payment-node-pct   { font-size: 15px; font-weight: 600; color: #1677ff; }
.payment-node-desc  { font-size: 12px; color: #8c8c8c; line-height: 1.4; }

.payment-contract-card { border: 1px solid #e8e8e8; border-radius: 8px; margin-bottom: 20px; overflow: hidden; }
.payment-contract-header { padding: 12px 16px; background: #fafafa; border-bottom: 1px solid #e8e8e8; }
.payment-contract-type { font-size: 14px; font-weight: 600; color: #262626; margin-bottom: 10px; }
.payment-contract-meta-row { display: flex; align-items: center; flex-wrap: wrap; gap: 6px 24px; }
.payment-meta-item { display: flex; align-items: center; gap: 4px; font-size: 13px; }
.payment-meta-label { color: #8c8c8c; }
.payment-meta-value { color: #262626; }
.payment-ratio-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.payment-ratio-table th { padding: 10px 12px; text-align: left; background: #f5f5f5; color: #595959; font-weight: 500; border-bottom: 1px solid #e8e8e8; }
.payment-ratio-table td { padding: 8px 12px; border-bottom: 1px solid #f0f0f0; vertical-align: middle; }
.payment-ratio-table tbody tr:last-child td { border-bottom: none; }

.photo-readonly-col   { display: flex; flex-direction: column; gap: 8px; margin-bottom: 8px; }
.photo-readonly-label { font-size: 14px; color: rgba(0,0,0,0.45); }
.photo-readonly-imgs  { display: flex; flex-wrap: wrap; gap: 8px; }
.empty-hint { font-size: 13px; color: #bbb; padding-top: 4px; }

.id-card-img        { width: 150px; height: 100px; border-radius: 7px; }
.id-card-img--front { background: #DDE8F4; }
.id-card-img--back  { background: #D6E3EF; }

.upload-hint-icon { margin-left: 4px; color: #8c8c8c; font-size: 13px; }

.copy-icon { margin-left: 5px; font-size: 12px; color: rgba(0,0,0,0.35); cursor: pointer; vertical-align: middle; position: relative; top: -0.5px; }
.copy-icon:hover { color: #1677ff; }
</style>
