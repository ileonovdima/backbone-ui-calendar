var monthNames = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];

var dayNames = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'];

var isLeapYear = function(year) {
    return ((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0);
};

var getDaysInMonth = function(date) {
    return [31, (isLeapYear(date.getYear()) ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][date.getMonth()];
};

var getDayOfWeak = function(date) {
    var day = date.getDay();
    if (day === 0) day = 7;
    return day - 1;
}

var getPreviousDate = function(date){
    return new Date (new Date (date.getFullYear(), date.getMonth(), -1));
}

var getNextDate = function(date){
    return new Date (new Date (date.getFullYear(), date.getMonth(), getDaysInMonth(date)+1));
}

var formatDateHead = function(date) {
    return monthNames[date.getMonth()] + ' ' + date.getFullYear();
};

var getDaysOfCalendar = function(date){
    var summDaysOfCalendar = 42;
    var daysInMonth = getDaysInMonth(date);

    var dayOfWeak = getDayOfWeak(new Date(date.getFullYear(), date.getMonth(), 1));

    var previousDate = getPreviousDate(date)
    var nextsDate = getNextDate(date)

    var daysOfCalendar = [];

    var daysInPreviousMonth = getDaysInMonth(previousDate);

    for (var i = 0; i < dayOfWeak; i++) {
        daysOfCalendar.unshift({date: new Date (previousDate.getFullYear(), previousDate.getMonth(), daysInPreviousMonth - i), otherMonth:true });
    }

    for (var i = 1; i <= daysInMonth; i++) {
        daysOfCalendar.push({date: new Date (date.getFullYear(), date.getMonth(), i), otherMonth:false });
    }

    var restDays = summDaysOfCalendar - daysOfCalendar.length;

    for (var i = 1; i <= restDays; i++) {
        daysOfCalendar.push({date: new Date (nextsDate.getFullYear(), nextsDate.getMonth(), i), otherMonth:true });
    }

    return  daysOfCalendar;

}



var ViewDayItem = Backbone.View.extend({
    initialize: function(options){
        this.elParent = options.elParent;
        this.dayDblClick = options.dayDblClick.bind(this, this.model, this.elParent);
        this.dayClick = options.dayClick.bind(this, this.model, this.elParent);
        this.delegateEvents();
    },
    tagName: "td",
    events: {
        "click a": "dayClick",
        "dblclick a": "dayDblClick"
    },
    render: function(){
        this.$el.html("<a>"+this.model.get("date").getDate()+"</a>");
        return this;
    }
});

var UICalendar = Backbone.View.extend({
    constructor: function(options){
        Backbone.View.apply(this, arguments);
        this.listenTo(this.collection, 'reset', this.render);
        this.date = this.collection.at(21).get("date");
    },
    events: {
        "click .prev": "prev",
        "click .next": "next"
    },
    prev: function() {
        this.date = getPreviousDate(this.date);
        this.collection.reset(getDaysOfCalendar(this.date));
    },
    next: function() {
        this.date = getNextDate(this.date);
        this.collection.reset(getDaysOfCalendar(this.date));
    },
    tagName: "table",
    className: "ui-calendar",
    afterItemRender: null,
    dayDblClick:null,
    dayClick: null,
    render: function() {
        this.$el.empty();
        var headEl = $("<tr><td><a class='prev'><</a></td><td colspan='5'><b>"+formatDateHead(this.date)+"</b></td><td ><a class='next'>></a></td></tr>");
        this.$el.html(headEl);
        var dayNamesEl = dayNames.reduce(function(tr, item) {
           tr.append("<td><b>" + item + "</b></td>")
           return tr;
        }, $("<tr>"));

        this.$el.append(dayNamesEl);

        var tr = $("<tr>");
        this.collection.each(function(model, index) {
            var viewDayItem = new ViewDayItem({model: model, dayDblClick: this.dayDblClick, dayClick: this.dayClick, elParent: this.el});
            tr.append(viewDayItem.render().el);
            if( typeof this.afterItemRender === "function") {
                this.afterItemRender(viewDayItem, model, index);
            }
            if(model.get("otherMonth")){
                viewDayItem.$el.addClass("other-month")
            } else {
                viewDayItem.$el.addClass("current-month")
            }
            if(!((index + 1) % 7)){
                this.$el.append(tr);
                tr = $("<tr>");
            }
        }, this);
        return this;
    }

});



var collectionDays = new Backbone.Collection();
collectionDays.reset(getDaysOfCalendar(new Date(2014, 6, 1)));


var collectionNotes = new Backbone.Collection();



var Field = Backbone.View.extend({
    initialize: function(){
        this.timeId = this.model.get('date').getTime();
    },
    className: "field",
    events:{
        "click": "stopProp",
        "click .textarea": "clickTextarea",
        "click button": "add",
    },
    add: function(ev){
        var val = this.$(".textarea").val();
        if (!val.length) return;
        var findModel = collectionNotes.findWhere({id: this.timeId});

        if(findModel){
            findModel.set("text", val);
            collectionDays.trigger("reset");
        } else {
            collectionNotes.add({"id": this.timeId, text: val});
            collectionDays.trigger("reset");
        }
    },
    stopProp: function(ev){
        ev.stopPropagation();
    },
    render: function(){
        this.$el.html("<textarea class = 'textarea' name='textarea'></textarea><button>сохранить</button>");
        var findModel = collectionNotes.findWhere({id: this.timeId});
        if(findModel){
            this.$("textarea").val(findModel.get("text"));
        }
        var that  = this;
        setTimeout(function(){
            that.$el.addClass("show");
        }, 100);
        return this;
    }

})


var Note = UICalendar.extend({
    collection: collectionDays,
    afterItemRender: function(view, model, index){
        var timeId = model.get('date').getTime();
        var findModel = collectionNotes.findWhere({id: timeId});
        if(findModel){
            view.$el.css("background", "#FFE3E3");
        }
    },
    dayClick: function(model, el, ev){
        $(el).find(".field").remove();
    },
    dayDblClick: function(model, el, ev){
        $(el).find(".field").remove();
        $(ev.target).append(new Field({model: model}).render().el)
    }
})


var note  = new Note();
$(".calendar").html(note.render().el);
